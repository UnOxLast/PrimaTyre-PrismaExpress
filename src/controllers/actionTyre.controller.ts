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
    const actionId = Number(req.params.id);
    const {
        isReady,
        dateTimeWork,
        dateTimeDone,
    } = req.body;

    if (isNaN(actionId)) {
        res.status(400).json({ error: 'Invalid ActionTyre ID' });
        return;
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Ambil ActionTyre + relasi Inspection + Tyre + removePurpose
            const action = await tx.actionTyre.findUnique({
                where: { id: actionId },
                include: {
                    inspections: {
                        include: { tyre: true }
                    },
                    removePurpose: true
                }
            });

            if (!action) {
                throw { status: 404, error: 'ActionTyre not found' };
            }

            const tyreId = action.inspections && action.inspections.length > 0 ? action.inspections[0].tyreId : undefined;
            if (!tyreId) {
                throw { status: 400, error: 'Associated Tyre not found in Inspection' };
            }

            let tyreUpdateData: any = {};

            if (isReady) {
                // Aksi selesai → ban siap dipakai
                tyreUpdateData = {
                    isReady: true,
                    isScrap: false,
                    removedPurpose: { disconnect: true } // Pastikan removedPurpose dihapus jika ada
                };
            } else {
                // Aksi belum selesai atau Scrap
                const doneIsFilled = !!dateTimeDone;

                if (doneIsFilled) {
                    if (action.removePurposeId == null) {
                        throw { status: 400, error: 'Associated removePurposeId not found in ActionTyre' };
                    }
                    const purpose = await tx.removePurpose.findUnique({
                        where: { id: action.removePurposeId },
                    });

                    tyreUpdateData = {
                        isReady: false,
                        isScrap: true,
                        removedPurposeId: purpose?.id, // Tetap gunakan removePurposeId yang ada jika bukan scrap
                    };
                } else {
                    // Belum selesai → jangan ubah status scrap
                    tyreUpdateData = {
                        isReady: false,
                        removedPurposeId: action.removePurposeId, // Tetap gunakan removePurposeId yang ada
                    };
                }
            }

            // Update ActionTyre
            const updatedAction = await tx.actionTyre.update({
                where: { id: actionId },
                data: {
                    isDone: !!dateTimeDone,
                    dateTimeWork: dateTimeWork ? new Date(dateTimeWork) : undefined,
                    dateTimeDone: dateTimeDone ? new Date(dateTimeDone) : undefined
                }
            });

            await tx.tyre.update({
                where: { id: tyreId },
                data: tyreUpdateData
            });

            res.status(200).json({
                message: 'ActionTyre updated successfully',
                data: updatedAction
            });
        });
    } catch (error: any) {
        if (error && error.status) {
            res.status(error.status).json({ error: error.error });
        } else {
            console.error('Error updating ActionTyre:', error);
            res.status(500).json({ error: 'Internal Server Error', message: error?.message });
        }
    }
};
