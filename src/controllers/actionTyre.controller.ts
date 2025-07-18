import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();
const actionTyreClient = prisma.actionTyre;
const tyreClient = prisma.tyre;
const removedPurposeClient = prisma.removePurpose;

//getAllActionTyre
export const getAllActionTyre = async (req: Request, res: Response) => {
    try {
        const actions = await actionTyreClient.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                removePurpose: true,  // relasi tujuan pelepasan
                inspections: true,
                tyre: {
                    include: {
                        stockTyre: true, // Jika ingin info serialNumber dsb.
                    },
                },
            },
        });

        res.status(200).json({
            data: actions
        });

    } catch (error: any) {
        console.error('Error retrieving ActionTyre:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

//updateActionTyre
export const updateActionTyre = async (req: Request, res: Response) => {
    try {
        const actionId = Number(req.params.id);
        if (isNaN(actionId)) {
            res.status(400).json({ error: 'Invalid ActionTyre ID format.' });
            return;
        }

        const {
            isReady,          // boolean | undefined (from body)
            dateTimeWork,     // string | undefined | null (from body)
            dateTimeDone,     // string | undefined | null (from body)
        } = req.body;

        // --- Input Validation for Request Body Fields ---
        if (isReady !== undefined && typeof isReady !== 'boolean') {
            res.status(400).json({ message: 'isReady must be a boolean if provided.' });
            return;
        }
        if (dateTimeWork !== undefined && typeof dateTimeWork !== 'string' && dateTimeWork !== null) {
            res.status(400).json({ message: 'dateTimeWork must be a date string or null if provided.' });
            return;
        }
        if (dateTimeDone !== undefined && typeof dateTimeDone !== 'string' && dateTimeDone !== null) {
            res.status(400).json({ message: 'dateTimeDone must be a date string or null if provided.' });
            return;
        }

        // --- Parse and Validate Date-Time Fields ---
        let parsedDateTimeWork: Date | undefined | null = undefined;
        if (dateTimeWork === null) { // Explicit null
            parsedDateTimeWork = null;
        } else if (dateTimeWork !== undefined) { // Provided and not null
            try {
                parsedDateTimeWork = new Date(dateTimeWork);
                if (isNaN(parsedDateTimeWork.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeWork format. Please provide a valid date string (e.g., YYYY-MM-DDTHH:mm:ssZ).' });
                    return;
                }
            } catch (e) {
                res.status(400).json({ message: 'Error parsing dateTimeWork. Please provide a valid date string.' });
                return;
            }
        }

        let parsedDateTimeDone: Date | undefined | null = undefined;
        // Jika isReady secara eksplisit disetel (true/false), maka dateTimeDone wajib ada.
        if (isReady !== undefined && (dateTimeDone === undefined || dateTimeDone === null)) {
            res.status(400).json({ message: 'dateTimeDone is required when isReady status is explicitly set.' });
            return;
        }
        // Parsing dateTimeDone jika diberikan
        if (dateTimeDone === null) { // Explicit null
            parsedDateTimeDone = null;
        } else if (dateTimeDone !== undefined) { // Provided and not null
            try {
                parsedDateTimeDone = new Date(dateTimeDone);
                if (isNaN(parsedDateTimeDone.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeDone format. Please provide a valid date string (e.g., YYYY-MM-DDTHH:mm:ssZ).' });
                    return;
                }
            } catch (e) {
                res.status(400).json({ message: 'Error parsing dateTimeDone. Please provide a valid date string.' });
                return;
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Ambil ActionTyre + relasi Inspeksi + Tyre + removePurpose
            const action = await tx.actionTyre.findUnique({
                where: { id: actionId },
                include: {
                    inspections: {
                        include: { tyre: true } // Include full tyre data for updates
                    },
                    removePurpose: true // Untuk pengecekan purpose, jika ada
                }
            });

            if (!action) {
                throw new Error('ActionTyre not found'); // Throw standard Error
            }

            // Pastikan ada ban yang terkait dengan ActionTyre ini
            // Asumsi: ActionTyre selalu terkait dengan 1 Inspeksi, dan Inspeksi terkait dengan 1 Ban
            const associatedTyre = action.inspections[0]?.tyre;
            if (!associatedTyre) {
                throw new Error('Associated Tyre not found for this ActionTyre. Data inconsistency.');
            }
            const tyreId = associatedTyre.id;

            // Data untuk update ActionTyre
            const actionUpdateData: any = {
                // isDone hanya akan true jika parsedDateTimeDone memiliki nilai Date yang valid (bukan null/undefined)
                isDone: parsedDateTimeDone !== undefined && parsedDateTimeDone !== null,
                dateTimeWork: parsedDateTimeWork ?? undefined, // Gunakan parsed value
                dateTimeDone: parsedDateTimeDone ?? undefined  // Gunakan parsed value
            };

            // Data untuk update Tyre (isReady, isScrap, removedPurposeId)
            let tyreUpdateData: any = {};

            // --- Logika Status Ban berdasarkan isReady dan dateTimeDone ---
            if (isReady === true) {
                // Skenario: Aksi selesai, ban siap dipakai kembali (repair success, dll)
                tyreUpdateData = {
                    isReady: true,
                    isScrap: false,
                    removedPurposeId: null, // Ban siap, tidak ada tujuan dilepas
                };
            } else if (isReady === false) {
                // Skenario: Aksi selesai, ban tidak siap / di-scrap
                const doneIsFilled = (parsedDateTimeDone !== undefined && parsedDateTimeDone !== null); // Cek waktu selesai

                if (doneIsFilled) {
                    // Jika waktu selesai ada, ini berarti aksi selesai dan ban di-scrap
                    if (action.removePurposeId == null) {
                        throw new Error('Associated removePurposeId is missing in ActionTyre data for non-ready (scrap) status.');
                    }
                    const purpose = await tx.removePurpose.findUnique({
                        where: { id: action.removePurposeId },
                    });
                    if (!purpose) { // Safeguard: check if purpose still exists
                        throw new Error(`Invalid removePurposeId ${action.removePurposeId} found in ActionTyre.`);
                    }

                    tyreUpdateData = {
                        isReady: false,
                        isScrap: true, // Langsung scrap jika isReady false DAN waktu selesai ada
                        removedPurposeId: purpose.id, // Gunakan removePurposeId dari Action
                    };
                } else {
                    // Jika isReady false TAPI waktu selesai TIDAK ADA (belum selesai)
                    // Belum selesai → jangan ubah status scrap, hanya set isReady: false
                    tyreUpdateData = {
                        isReady: false,
                        isScrap: associatedTyre.isScrap, // Pertahankan status scrap sebelumnya jika belum selesai
                        removedPurposeId: action.removePurposeId, // Pertahankan removePurposeId yang ada
                    };
                }
            } else {
                // isReady TIDAK diberikan (undefined). Asumsi: Aksi masih berjalan, atau hanya update waktu.
                // Status isReady/isScrap ban tidak berubah oleh permintaan ini.
                // ActionTyre mungkin hanya update dateTimeWork / dateTimeDone saja.
                // update data tyre tetap kosong untuk perubahan isReady/isScrap
            }


            // Update ActionTyre
            const updatedAction = await tx.actionTyre.update({
                where: { id: actionId },
                data: actionUpdateData
            });

            // Update Tyre (hanya jika ada perubahan status yang ditentukan)
            if (Object.keys(tyreUpdateData).length > 0) {
                await tx.tyre.update({
                    where: { id: tyreId },
                    data: tyreUpdateData
                });
            }

            // Return hasil transaksi
            return updatedAction;

        }); // End of transaction

        res.status(200).json({
            message: 'ActionTyre updated successfully',
            data: result
        });
        return;

    } catch (error: any) {
        // --- Centralized Error Handling ---
        console.error('Error updating ActionTyre:', error);

        // Map custom thrown errors to specific HTTP statuses
        if (error.message === 'ActionTyre not found') {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error.message === 'Associated Tyre not found for this ActionTyre. Data inconsistency.') {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message.includes('RemovePurpose is missing') || error.message.includes('Invalid removePurposeId')) {
            res.status(400).json({ error: error.message });
            return;
        }
        // Handle input parsing errors (dateTimeWork/Done)
        if (error.message.includes('Invalid dateTime') || error.message.includes('Error parsing dateTime')) {
            res.status(400).json({ message: error.message });
            return;
        }

        // Handle specific Prisma errors
        if (error.code === 'P2002') { // Unique constraint violation
            res.status(409).json({ error: `Duplicate entry: ${error.meta?.target}` });
            return;
        }
        if (error.code === 'P2025') { // Record not found for update/delete (e.g., if actionId not found)
            res.status(404).json({ message: 'Record not found for update.', error: error.message });
            return;
        }

        // Generic internal server error for unhandled exceptions
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
        return;
    }
};
