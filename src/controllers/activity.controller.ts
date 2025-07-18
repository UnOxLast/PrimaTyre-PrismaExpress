import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";
import ExcelJS from 'exceljs';
import { formatInTimeZone } from 'date-fns-tz'; // Install date-fns-tz if not already installed


const activityClient = new PrismaClient().activityTyre;
const tyreClient = new PrismaClient().tyre
const prismaClient = new PrismaClient();

//getAllActivity
export const getAllActivityTyre = async (req: Request, res: Response) => {
    try {
        const activities = await activityClient.findMany({
            include: {
                inspections: {
                    include: {
                        actionTyre: true, // Jika ingin info actionTyre terkait
                    }
                }
            },
            orderBy: {
                dateTimeWork: 'asc',
            },
        });
        res.status(200).json({ data: activities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve activities' });
    }
};

//getActivityByTyreId
export const getActivityByTyreId = async (req: Request, res: Response) => {
    try {
        const tyreId = Number(req.params.id);
        if (!tyreId) {
            res.status(400).json({ error: 'Invalid tyre ID' });
            return;
        }

        // Ambil data tyre beserta stockTyre-nya
        const tyre = await tyreClient.findUnique({
            where: { id: tyreId },
            include: {
                stockTyre: {
                    include: {
                        merk: true,
                        tyreSize: true
                    }
                },
                installedUnit: true
            }
        });


        if (!tyre) {
            res.status(404).json({ error: 'Tyre not found' });
            return;
        }

        // Ambil semua activity yang melibatkan tyre ini
        const activities = await activityClient.findMany({
            where: {
                OR: [
                    { installedTyreId: tyreId },
                    { removedTyreId: tyreId }
                ]
            },
            orderBy: {
                dateTimeWork: 'asc'
            },
            include: {
                installedTyre: true,
                removedTyre: true,
                unit: true,
                removePurpose: true,
                airCondition: true,
                inspections: {
                    include: {
                        removePurpose: true, // Jika ingin info removePurpose terkait
                        actionTyre: {
                            include: {
                                removePurpose: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            tyre,
            stockTyre: tyre.stockTyre,
            activities
        });

    } catch (error: any) {
        console.error("Failed to get activity history:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};

export const createActivityTyre = async (req: Request, res: Response) => {
    try {
        const {
            unitId,
            hmAtActivity,
            kmAtActivity,
            location,
            removedTyreId: removedStockTyreIdInput, // Input ini adalah StockTyreId
            tread1Remove,
            tread2Remove,
            removeReasonId,
            removePurposeId,
            installedTyreId: installedStockTyreIdInput, // Input ini adalah StockTyreId
            tread1Install,
            tread2Install,
            airConditionId,
            airPressure,
            manpower,
            dateTimeWork,
            dateTimeDone,
            tyrePosition // Posisi ban dari input (sekarang opsional)
        } = req.body;

        // --- 1. Validasi Input Awal ---
        if (!unitId || typeof unitId !== 'number') {
            res.status(400).json({ message: 'unitId is required and must be a number.' });
            return;
        }
        if (hmAtActivity === undefined || typeof hmAtActivity !== 'number') {
            res.status(400).json({ message: 'hmAtActivity is required and must be a number.' });
            return;
        }
        if (kmAtActivity === undefined || typeof kmAtActivity !== 'number') {
            res.status(400).json({ message: 'kmAtActivity is required and must be a number.' });
            return;
        }
        if (location !== undefined && typeof location !== 'string' && location !== null) {
            res.status(400).json({ message: 'location must be a string or null.' });
            return;
        }

        // Pastikan setidaknya ada removedTyreId atau installedTyreId (sebagai StockTyreId)
        if (!removedStockTyreIdInput && !installedStockTyreIdInput) {
            res.status(400).json({ message: 'Either removedTyreId or installedTyreId must be provided (as StockTyreId).' });
            return;
        }

        // Validasi tipe data StockTyreId
        if (removedStockTyreIdInput !== undefined && typeof removedStockTyreIdInput !== 'number' && removedStockTyreIdInput !== null) {
            res.status(400).json({ message: 'removedTyreId must be a number or null.' });
            return;
        }
        if (installedStockTyreIdInput !== undefined && typeof installedStockTyreIdInput !== 'number' && installedStockTyreIdInput !== null) {
            res.status(400).json({ message: 'installedTyreId must be a number or null.' });
            return;
        }

        // Validasi dan parsing tanggal
        let parsedDateTimeWork: Date | undefined;
        if (dateTimeWork) {
            try {
                parsedDateTimeWork = new Date(dateTimeWork);
                if (isNaN(parsedDateTimeWork.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeWork format.' });
                    return;
                }
            } catch (e) {
                res.status(400).json({ message: 'Error parsing dateTimeWork.' });
                return;
            }
        } else {
            parsedDateTimeWork = new Date();
        }

        let parsedDateTimeDone: Date | undefined | null;
        if (dateTimeDone === null) {
            parsedDateTimeDone = null;
        } else if (dateTimeDone !== undefined) {
            try {
                parsedDateTimeDone = new Date(dateTimeDone);
                if (isNaN(parsedDateTimeDone.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeDone format.' });
                    return;
                }
            } catch (e) {
                res.status(400).json({ message: 'Error parsing dateTimeDone.' });
                return;
            }
        }

        // --- Validasi Relasi ID (penting untuk P2003 dan konversi StockTyreId ke TyreId) ---
        let removedTyreDetails: any = null;
        let finalRemovedTyreId: number | null = null;
        if (removedStockTyreIdInput) {
            removedTyreDetails = await prismaClient.tyre.findUnique({
                where: { stockTyreId: removedStockTyreIdInput }, // Cari berdasarkan stockTyreId
                select: { id: true, tread1: true, tread2: true, isInstalled: true, isDeleted: true, hmTyre: true, kmTyre: true, installedUnitId: true, positionTyre: true, stockTyre: { select: { oHM: true, oKM: true } } }
            });
            if (!removedTyreDetails) {
                res.status(404).json({ message: `Removed Tyre (StockTyre ID ${removedStockTyreIdInput}) not found or has no associated Tyre instance.` });
                return;
            }
            if (removedTyreDetails.isDeleted) {
                res.status(400).json({ message: `Removed Tyre (StockTyre ID ${removedStockTyreIdInput}) is deleted.` });
                return;
            }
            if (!removedTyreDetails.isInstalled || removedTyreDetails.installedUnitId !== unitId) {
                res.status(400).json({ message: `Removed Tyre (StockTyre ID ${removedStockTyreIdInput}) is not currently installed on this unit.` });
                return;
            }
            finalRemovedTyreId = removedTyreDetails.id; // Simpan Tyre.id yang sebenarnya
        }

        let installedTyreDetails: any = null;
        let finalInstalledTyreId: number | null = null;
        if (installedStockTyreIdInput) {
            installedTyreDetails = await prismaClient.tyre.findUnique({
                where: { stockTyreId: installedStockTyreIdInput }, // Cari berdasarkan stockTyreId
                select: { id: true, tread1: true, tread2: true, isInstalled: true, isDeleted: true, isReady: true }
            });
            if (!installedTyreDetails) {
                res.status(404).json({ message: `Installed Tyre (StockTyre ID ${installedStockTyreIdInput}) not found or has no associated Tyre instance.` });
                return;
            }
            if (installedTyreDetails.isDeleted) {
                res.status(400).json({ message: `Installed Tyre (StockTyre ID ${installedStockTyreIdInput}) is deleted.` });
                return;
            }
            if (installedTyreDetails.isInstalled) {
                res.status(400).json({ message: `Installed Tyre (StockTyre ID ${installedStockTyreIdInput}) is already installed on another unit.` });
                return;
            }
            if (!installedTyreDetails.isReady) {
                res.status(400).json({ message: `Installed Tyre (StockTyre ID ${installedStockTyreIdInput}) is not ready for installation.` });
                return;
            }
            finalInstalledTyreId = installedTyreDetails.id; // Simpan Tyre.id yang sebenarnya
        }

        // Validasi relasi ID lainnya jika diberikan (tetap sama)
        if (removeReasonId !== undefined && removeReasonId !== null) {
            const reason = await prismaClient.removeReason.findUnique({ where: { id: removeReasonId } });
            if (!reason) {
                res.status(404).json({ message: `RemoveReason ID ${removeReasonId} not found.` });
                return;
            }
        }
        if (removePurposeId !== undefined && typeof removePurposeId !== 'number' && removePurposeId !== null) {
            res.status(400).json({ message: 'removePurposeId must be a number or null.' });
            return;
        }
        if (removePurposeId !== undefined && removePurposeId !== null) {
            const purpose = await prismaClient.removePurpose.findUnique({ where: { id: removePurposeId } });
            if (!purpose) {
                res.status(404).json({ message: `RemovePurpose ID ${removePurposeId} not found.` });
                return;
            }
        }
        if (airConditionId !== undefined && airConditionId !== null) {
            const condition = await prismaClient.airCondition.findUnique({ where: { id: airConditionId } });
            if (!condition) {
                res.status(404).json({ message: `AirCondition ID ${airConditionId} not found.` });
                return;
            }
        }

        // --- Transaksi Atomic ---
        const newActivity = await prismaClient.$transaction(async (tx) => {
            // 1. Validasi Unit
            const unit = await tx.unit.findUnique({
                where: { id: unitId },
                include: { tyres: true, UnitTyreAmount: true } // Include UnitTyreAmount for total tyre amount
            });
            if (!unit) throw new Error("Unit not found");
            if (!unit.UnitTyreAmount) throw new Error("UnitTyreAmount configuration missing for this unit.");


            // --- 2. Tentukan posisi ban yang akan digunakan secara otomatis ---
            let finalTyrePosition: number | undefined = tyrePosition; // Ambil dari input jika ada

            // Jika posisi diberikan di input
            if (finalTyrePosition !== undefined && typeof finalTyrePosition === 'number') {
                if (finalTyrePosition <= 0 || finalTyrePosition > unit.UnitTyreAmount.amount) {
                    throw new Error(`Tyre position ${finalTyrePosition} is out of valid range (1 to ${unit.UnitTyreAmount.amount}) for Unit ID ${unitId}.`);
                }
                // Jika hanya memasang (tidak melepas), pastikan posisi yang diberikan kosong
                if (!finalRemovedTyreId && finalInstalledTyreId) {
                    const positionOccupied = unit.tyres.some(pos => pos.position === finalTyrePosition && pos.tyreId !== null);
                    if (positionOccupied) {
                        throw new Error(`Position ${finalTyrePosition} on Unit ID ${unitId} is already occupied by another tyre.`);
                    }
                }
                // Jika melepas, pastikan ban yang dilepas ada di posisi itu
                if (finalRemovedTyreId && removedTyreDetails.positionTyre !== finalTyrePosition) {
                    throw new Error(`Removed Tyre (ID ${finalRemovedTyreId}) is not installed at position ${finalTyrePosition} on this unit.`);
                }
            } else {
                // Jika tyrePosition TIDAK diberikan di input, tentukan secara otomatis
                if (finalRemovedTyreId) {
                    // Prioritas 1: Ambil dari ban yang dilepas (jika ada)
                    finalTyrePosition = removedTyreDetails?.positionTyre ?? undefined;
                    if (!finalTyrePosition) {
                        throw new Error(`Removed Tyre (ID ${finalRemovedTyreId}) has no assigned position on this unit to infer tyrePosition automatically.`);
                    }
                } else if (finalInstalledTyreId) {
                    // Prioritas 2: Cari posisi kosong (jika hanya memasang)
                    const existingPositions = new Set(unit.tyres.map(p => p.position).filter(p => p !== null));
                    let foundEmptyPosition: number | undefined;

                    for (let i = 1; i <= unit.UnitTyreAmount.amount; i++) {
                        const positionHasTyre = unit.tyres.some(pos => pos.position === i && pos.tyreId !== null);
                        if (!positionHasTyre) {
                            foundEmptyPosition = i;
                            break;
                        }
                    }

                    if (!foundEmptyPosition) {
                        throw new Error(`No empty tyre position found on Unit ID ${unitId}. All positions are occupied.`);
                    }
                    finalTyrePosition = foundEmptyPosition;
                } else {
                    // Ini tidak seharusnya tercapai karena validasi awal sudah memastikan removedTyreId atau installedTyreId ada
                    throw new Error("Tyre activity must involve either removal or installation, and a position could not be determined automatically.");
                }
            }

            // Validasi final finalTyrePosition (setelah otomatisasi)
            if (finalTyrePosition === undefined || finalTyrePosition === null) {
                throw new Error("Failed to determine a valid tyre position for the activity.");
            }
            if (finalTyrePosition <= 0 || finalTyrePosition > unit.UnitTyreAmount.amount) {
                throw new Error(`Determined tyre position ${finalTyrePosition} is out of valid range (1 to ${unit.UnitTyreAmount.amount}) for Unit ID ${unitId}.`);
            }


            // 3. Update posisi ban pada UnitTyrePosition (penting untuk proses pasang/lepas)
            if (finalRemovedTyreId) { // Jika ada ban yang dilepas, kosongkan posisi lama
                await tx.unitTyrePosition.updateMany({
                    where: { unitId, position: finalTyrePosition, tyreId: finalRemovedTyreId }, // Gunakan finalRemovedTyreId
                    data: { tyreId: { set: null } }
                });
            }

            if (finalInstalledTyreId) { // Jika ada ban yang dipasang, pasang di posisi yang ditentukan
                await tx.unitTyrePosition.upsert({
                    where: {
                        unitId_position: {
                            unitId,
                            position: finalTyrePosition
                        }
                    },
                    update: { tyreId: finalInstalledTyreId }, // Gunakan finalInstalledTyreId
                    create: {
                        unitId,
                        position: finalTyrePosition,
                        tyreId: finalInstalledTyreId
                    }
                });
            }


            // 4. Update status Tyre yang dilepas
            if (finalRemovedTyreId && removedTyreDetails) { // Gunakan finalRemovedTyreId
                await tx.tyre.update({
                    where: { id: finalRemovedTyreId },
                    data: {
                        tread1: tread1Remove ?? removedTyreDetails.tread1 ?? undefined,
                        tread2: tread2Remove ?? removedTyreDetails.tread2 ?? undefined,
                        isReady: true,
                        isInstalled: false,
                        installedUnitId: null,
                        positionTyre: null,
                        removedPurposeId: removePurposeId ?? undefined,
                        dateTimeWork: parsedDateTimeDone,
                    }
                });

                // Recalculate total HM/KM for removed tyre
                const activitiesForRemovedTyre = await tx.activityTyre.findMany({
                    where: {
                        OR: [
                            { installedTyreId: finalRemovedTyreId }, // Gunakan finalRemovedTyreId
                            { removedTyreId: finalRemovedTyreId }    // Gunakan finalRemovedTyreId
                        ],
                    },
                    orderBy: { dateTimeWork: 'asc' },
                    select: {
                        installedTyreId: true,
                        removedTyreId: true,
                        hmAtActivity: true,
                        kmAtActivity: true,
                        dateTimeWork: true,
                    }
                });

                let accumulatedHM = removedTyreDetails.stockTyre?.oHM ?? 0;
                let accumulatedKM = removedTyreDetails.stockTyre?.oKM ?? 0;

                let lastInstallHM: number | null = null;
                let lastInstallKM: number | null = null;

                for (const activity of activitiesForRemovedTyre) {
                    if (activity.installedTyreId === finalRemovedTyreId) {
                        lastInstallHM = activity.hmAtActivity ?? 0;
                        lastInstallKM = activity.kmAtActivity ?? 0;
                    } else if (activity.removedTyreId === finalRemovedTyreId && lastInstallHM !== null && lastInstallKM !== null) {
                        const removalHM = activity.hmAtActivity ?? 0;
                        const removalKM = activity.kmAtActivity ?? 0;
                        accumulatedHM += Math.max(removalHM - lastInstallHM, 0);
                        accumulatedKM += Math.max(removalKM - lastInstallKM, 0);
                        lastInstallHM = null;
                        lastInstallKM = null;
                    }
                }

                await tx.tyre.update({
                    where: { id: finalRemovedTyreId },
                    data: {
                        hmTyre: accumulatedHM,
                        kmTyre: accumulatedKM,
                    }
                });
            }

            // 5. Update status Tyre yang dipasang
            if (finalInstalledTyreId && installedTyreDetails && finalTyrePosition) { // Gunakan finalInstalledTyreId
                await tx.tyre.update({
                    where: { id: finalInstalledTyreId },
                    data: {
                        tread1: tread1Install ?? installedTyreDetails.tread1 ?? undefined,
                        tread2: tread2Install ?? installedTyreDetails.tread2 ?? undefined,
                        isReady: false,
                        isInstalled: true,
                        installedUnitId: unitId,
                        positionTyre: finalTyrePosition,
                        removedPurposeId: null,
                        dateTimeWork: parsedDateTimeWork,
                    }
                });
            }

            // 6. Update Unit jika ada perubahan HM/KM/Location
            const unitUpdateData: any = {};
            if (hmAtActivity !== undefined && unit.hmUnit !== hmAtActivity) unitUpdateData.hmUnit = hmAtActivity;
            if (kmAtActivity !== undefined && unit.kmUnit !== kmAtActivity) unitUpdateData.kmUnit = kmAtActivity;
            if (location !== undefined && unit.location !== location) unitUpdateData.location = location;

            if (Object.keys(unitUpdateData).length > 0) {
                await tx.unit.update({
                    where: { id: unitId },
                    data: unitUpdateData
                });
            }

            // 7. Simpan log aktivitas
            const createdActivity = await tx.activityTyre.create({
                data: {
                    unitId,
                    hmAtActivity: hmAtActivity ?? 0,
                    kmAtActivity: kmAtActivity ?? 0,
                    location: location ?? null,
                    removedTyreId: finalRemovedTyreId, // Gunakan finalRemovedTyreId
                    tread1Remove: tread1Remove ?? removedTyreDetails?.tread1 ?? null,
                    tread2Remove: tread2Remove ?? removedTyreDetails?.tread2 ?? null,
                    removeReasonId,
                    removePurposeId,
                    installedTyreId: finalInstalledTyreId, // Gunakan finalInstalledTyreId
                    tread1Install: tread1Install ?? installedTyreDetails?.tread1 ?? null,
                    tread2Install: tread2Install ?? installedTyreDetails?.tread2 ?? null,
                    airConditionId,
                    airPressure,
                    manpower,
                    dateTimeWork: parsedDateTimeWork,
                    dateTimeDone: parsedDateTimeDone,
                    tyrePosition: finalTyrePosition
                }
            });

            // 8. Buat/Update InspectionTyre untuk ban yang dilepas/dipasang
            let tyreForNewInspection = null;
            if (finalRemovedTyreId && removedTyreDetails) { // Gunakan finalRemovedTyreId
                tyreForNewInspection = removedTyreDetails;
            } else if (finalInstalledTyreId && installedTyreDetails) { // Gunakan finalInstalledTyreId
                tyreForNewInspection = installedTyreDetails;
            }

            if (tyreForNewInspection && finalTyrePosition) {
                let newInspectionData: any = {
                    tyreId: tyreForNewInspection.id,
                    activityTyreId: createdActivity.id,
                    unitId: unitId,
                    positionTyre: finalTyrePosition,
                    dateTimeIn: parsedDateTimeWork,
                    isDone: false,
                    otd: tyreForNewInspection.tread1 ?? undefined,
                    treadRemaining: tyreForNewInspection.tread1 ?? undefined,
                    installDate: finalRemovedTyreId ? (await tx.activityTyre.findFirst({ where: { installedTyreId: finalRemovedTyreId }, orderBy: { dateTimeWork: 'desc' } }))?.dateTimeWork : undefined,
                    removeDate: finalInstalledTyreId ? (await tx.activityTyre.findFirst({ where: { removedTyreId: finalInstalledTyreId }, orderBy: { dateTimeWork: 'desc' } }))?.dateTimeWork : undefined,
                    removePurposeId: removePurposeId ?? undefined,
                };

                await tx.inspectionTyre.create({
                    data: newInspectionData
                });
            }

            return createdActivity;
        });

        res.status(201).json({ message: "Activity Created Successfully", result: newActivity });
        return;

    } catch (error: any) {
        console.error("Failed to create activity:", error);
        // Tangani error khusus yang kita throw
        if (error.message === "Unit not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("Tyre (StockTyre ID") && error.message.includes("not found")) {
            res.status(404).json({ message: error.message }); // Adjusted message for StockTyreId input
            return;
        }
        if (error.message.includes("Tyre (StockTyre ID") && (error.message.includes("is deleted") || error.message.includes("is already installed") || error.message.includes("is not ready") || error.message.includes("has no associated Tyre instance"))) {
            res.status(400).json({ message: error.message }); // Adjusted message for StockTyreId input
            return;
        }
        if (error.message.includes("Removed Tyre (ID") && error.message.includes("is not installed at position")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message.includes("Removed Tyre (ID") && error.message.includes("has no assigned position")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message.includes("tyrePosition is required")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message.includes("No empty tyre position found")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message.includes("Position") && error.message.includes("is already occupied")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message.includes("Tyre position") && error.message.includes("is out of valid range")) {
            res.status(400).json({ message: error.message });
            return;
        }


        // Tangani error Prisma umum
        if (error.code === 'P2003') { // Foreign key constraint violation
            res.status(400).json({ message: `Foreign key constraint failed: ${error.meta?.constraint || 'Unknown constraint'}. Check related IDs.` });
            return;
        }
        if (error.code === 'P2002') { // Unique constraint violation
            res.status(409).json({ message: `Duplicate entry: ${error.meta?.target || 'Unknown field'}` });
            return;
        }

        // Error generik
        res.status(500).json({ error: "Internal server error", message: error.message });
        return;
    }
};


//exportActivityToExcel
export const exportActivityToExcel = async (req: Request, res: Response) => {
    try {
        const { siteId, startDate, endDate, roleId } = req.body;

        // Validasi input
        if (roleId !== 1 && !siteId) {
            res.status(400).json({ error: 'siteId is required for non-admin roles' });
            return;
        }

        const filters: any = {};
        if (roleId !== 1) {
            filters.unit = { siteId: Number(siteId) };
        }

        // Jika tanggal tidak diberikan, gunakan hari ini
        const today = new Date();
        if (!startDate && !endDate) {
            filters.dateTimeWork = {
                gte: new Date(today.setHours(0, 0, 0, 0)), // Awal hari ini
                lte: new Date(today.setHours(23, 59, 59, 999)), // Akhir hari ini
            };
        } else if (startDate && !endDate) {
            const start = new Date(startDate as string);
            filters.dateTimeWork = {
                gte: new Date(start.setHours(0, 0, 0, 0)), // Awal hari
                lte: new Date(start.setHours(23, 59, 59, 999)), // Akhir hari
            };
        } else {
            filters.dateTimeWork = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        const activities = await activityClient.findMany({
            where: filters,
            include: {
                unit: { include: { site: true } },
                removedTyre: {
                    include: {
                        stockTyre: {
                            include: { merk: true, tyreSize: true }
                        }
                    }
                },
                installedTyre: {
                    include: {
                        stockTyre: {
                            include: { merk: true, tyreSize: true }
                        }
                    }
                },
                removeReason: true,
                removePurpose: true,
                airCondition: true,
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ActivityTyre');


        // Merge kolom header utama
        worksheet.mergeCells('A1:A2'); // SITE
        worksheet.mergeCells('B1:B2'); // TANGGAL JAM PENGERJAAN
        worksheet.mergeCells('C1:C2'); // NOMOR UNIT
        worksheet.mergeCells('D1:D2'); // HM UNIT
        worksheet.mergeCells('E1:E2'); // LOKASI
        worksheet.mergeCells('F1:F2'); // POSISI TYRE

        worksheet.mergeCells('G1:M1'); // REMOVE group
        worksheet.mergeCells('N1:T1'); // INSTALL group

        worksheet.mergeCells('U1:U2'); // MANPOWER
        worksheet.mergeCells('V1:V2'); // TANGGAL JAM SELESAI

        // Header utama (baris 1)
        worksheet.getCell('A1').value = 'SITE'
        worksheet.getCell('B1').value = 'TANGGAL JAM PENGERJAAN'
        worksheet.getCell('C1').value = 'NOMOR UNIT'
        worksheet.getCell('D1').value = 'HM UNIT'
        worksheet.getCell('E1').value = 'LOKASI'
        worksheet.getCell('F1').value = 'POSISI TYRE'
        worksheet.getCell('G1').value = 'REMOVE TYRE'
        worksheet.getCell('N1').value = 'INSTALL TYRE'
        worksheet.getCell('U1').value = 'MANPOWER'
        worksheet.getCell('V1').value = 'TANGGAL JAM SELESAI'

        //'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'ALASAN DILEPAS', 'DIPOSISIKAN UNTUK',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'PSI', 'KONDISI TEKANAN',
        // Sub-header (baris 2)
        const removeHeaders = [
            'SN TYRE', 'SIZE TYRE',
            'MERK & PATTERN TYRE', 'TREAD TYRE', 'HM/KM TYRE',
            'ALASAN DILEPAS', 'DISPOSISI UNTUK'
        ]
        removeHeaders.forEach((text, i) => {
            worksheet.getCell(2, 7 + i).value = text // Kolom I (9) sampai Q (17)
        })

        const installHeaders = [
            'SN TYRE', 'SIZE TYRE', 'MERK & PATTERN TYRE',
            'TREAD TYRE', 'HM/KM TYRE', 'KONDISI TEKANAN ANGIN', 'PRESSURE (Psi)'
        ]
        installHeaders.forEach((text, i) => {
            worksheet.getCell(2, 14 + i).value = text // Kolom R (18) sampai X (24)
        })
            ;['G1'].forEach((cell) => {
                worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' }
                worksheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } }
                worksheet.getCell(cell).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3333' } // merah gelap
                }
            })
            ;['N1'].forEach((cell) => {
                worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' }
                worksheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } }
                worksheet.getCell(cell).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '228B22' } // merah gelap
                }
            })

        const allBorders = {
            top: { style: 'thin' as ExcelJS.BorderStyle },
            left: { style: 'thin' as ExcelJS.BorderStyle },
            bottom: { style: 'thin' as ExcelJS.BorderStyle },
            right: { style: 'thin' as ExcelJS.BorderStyle },
        };

        // // Header styling
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } } // biru
            cell.border = allBorders
        })
        worksheet.getRow(2).eachCell((cell) => {
            cell.font = { bold: true }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } } // ungu muda
            cell.border = allBorders
        })

        worksheet.columns = [
            { key: 'site', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'dateTimeWork', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // TANGGAL JAM PENGERJAAN
            { key: 'nomorUnit', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // NOMOR UNIT
            { key: 'hmUnit', width: 10, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // HM UNIT
            { key: 'location', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // LOKASI
            { key: 'tyrePosition', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // POSISI TYRE

            // REMOVE
            { key: 'removeSN', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeMerk', width: 30, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeTread', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeHMKM', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeReason', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removePurpose', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },

            // INSTALL
            { key: 'installSN', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installMerk', width: 30, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installTread', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installHMKM', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'airPressure', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'airCondition', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },

            { key: 'manpower', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'dateTimeDone', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
        ]






        // worksheet.getRow(1).height = 25
        // worksheet.getRow(2).height = 20

        // //header
        // worksheet.getCell('A1').value = 'SITE'
        // worksheet.getCell('B1').value = 'TANGGAL JAM PENGERJAAN'
        // worksheet.getCell('C1').value = 'NOMOR UNIT'
        // worksheet.getCell('D1').value = 'HM UNIT'
        // worksheet.getCell('E1').value = 'LOKASI'
        // worksheet.getCell('F1').value = 'POSISI TYRE'
        // worksheet.getCell('U1').value = 'MANPOWER'
        // worksheet.getCell('V1').value = 'TANGGAL JAM SELESAI'

        // // Header Group Labels (bold, caps, colored)
        // worksheet.getCell('G1').value = 'REMOVE'
        // worksheet.getCell('N1').value = 'INSTALL'



        // // Sub-headers (baris ke-2)
        // worksheet.getRow(2).values = [
        //     '',
        //     '',
        //     '',
        //     '',
        //     '',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'ALASAN DILEPAS', 'DIPOSISIKAN UNTUK',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'PSI', 'KONDISI TEKANAN',
        //     '', ''
        // ]



        // // ExcelJS BorderStyle expects specific string literals, not just any string.
        // // Use 'thin' as type: BorderStyle
        // const allBorders = {
        //     top: { style: 'thin' as ExcelJS.BorderStyle },
        //     left: { style: 'thin' as ExcelJS.BorderStyle },
        //     bottom: { style: 'thin' as ExcelJS.BorderStyle },
        //     right: { style: 'thin' as ExcelJS.BorderStyle },
        // };
        // // Style baris sub-header
        // worksheet.getRow(1).eachCell((cell) => {
        //     cell.border = allBorders
        // })
        // worksheet.getRow(2).eachCell((cell) => {
        //     cell.border = allBorders
        //     cell.alignment = { vertical: 'middle', horizontal: 'center' }
        //     cell.font = { bold: true }
        //     cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: 'FFE5E5E5' } // abu terang
        //     }
        // })


        activities.forEach((activity) => {
            const formatDateTime = (date: Date | null | undefined) => {
                if (!date) return '';
                return formatInTimeZone(date, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
            };

            const row = {
                site: activity.unit?.site?.name,
                dateTimeWork: formatDateTime(activity.dateTimeWork), // Format to Jakarta timezone
                nomorUnit: activity.unit?.nomorUnit,
                hmUnit: activity.hmAtActivity,
                location: activity.location,
                tyrePosition: activity.tyrePosition,

                removeSN: activity.removedTyre?.stockTyre?.serialNumber || '',
                removeSize: activity.removedTyre?.stockTyre?.tyreSize?.size || '',
                removeMerk: `${activity.removedTyre?.stockTyre?.merk?.name || ''} - ${activity.removedTyre?.stockTyre?.pattern || ''}`,
                removeTread: `${activity.tread1Remove || ''}/${activity.tread2Remove || ''}`,
                removeHMKM: `${activity.removedTyre?.hmTyre || ''}/${activity.removedTyre?.kmTyre || ''}`,
                removeReason: activity.removeReason?.description || '',
                removePurpose: activity.removePurpose?.name || '',

                installSN: activity.installedTyre?.stockTyre?.serialNumber || '',
                installSize: activity.installedTyre?.stockTyre?.tyreSize?.size || '',
                installMerk: `${activity.installedTyre?.stockTyre?.merk?.name || ''} - ${activity.installedTyre?.stockTyre?.pattern || ''}`,
                installTread: `${activity.tread1Install || ''}/${activity.tread2Install || ''}`,
                installHMKM: `${activity.installedTyre?.hmTyre || '0'}/${activity.installedTyre?.kmTyre || '0'}`,
                airPressure: activity.airPressure || '',
                airCondition: activity.airCondition?.name || '',

                manpower: activity.manpower || '',
                dateTimeDone: formatDateTime(activity.dateTimeDone), // Format to Jakarta timezone
            };

            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_tyre.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal membuat file Excel' });
    }
};




