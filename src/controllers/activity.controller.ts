import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";


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

//activityTyre
export const createActivityTyre = async (req: Request, res: Response) => {
    try {
        const {
            unitId,
            hmAtActivity,
            kmAtActivity,
            location,
            removedTyreId,
            tread1Remove,
            tread2Remove,
            removeReasonId,
            removePurposeId,
            installedTyreId,
            tread1Install,
            tread2Install,
            airConditionId,
            airPressure,
            manpower,
            dateTimeWork,
            dateTimeDone,
            tyrePosition // posisi ban pada unit (1-based)
        } = req.body;

        const result = await prismaClient.$transaction(async (tx) => {
            // 1. Validasi Unit
            const unit = await tx.unit.findUnique({
                where: { id: unitId },
                include: {
                    tyres: true // relasi ke UnitTyrePosition
                }
            });
            if (!unit) throw new Error("Unit not found");

            // 2. Validasi posisi dan ban yang dilepas
            let positionToUse = tyrePosition;
            let removedPosition: number | undefined = undefined;

            if (removedTyreId) {
                // Cari posisi ban yang dilepas pada unit
                const pos = unit.tyres.find(
                    (pos) => pos.tyreId === removedTyreId
                );
                if (!pos) throw new Error("Removed tyre is not currently installed in this unit");
                removedPosition = pos.position === null ? undefined : pos.position;
                // Jika posisi tidak diberikan, gunakan posisi dari DB
                if (!positionToUse) positionToUse = removedPosition;
            }

            // 3. Update posisi ban pada UnitTyrePosition
            if (removedTyreId && positionToUse) {
                // Kosongkan posisi lama (hapus atau set tyreId ke null)
                await tx.unitTyrePosition.updateMany({
                    where: { unitId, position: positionToUse, tyreId: removedTyreId },
                    data: { tyreId: { set: null } }
                });
            }
            if (installedTyreId && positionToUse) {
                // Pasang ban baru di posisi tersebut
                await tx.unitTyrePosition.upsert({
                    where: {
                        unitId_position: {
                            unitId,
                            position: positionToUse
                        }
                    },
                    update: { tyreId: installedTyreId },
                    create: {
                        unitId,
                        position: positionToUse,
                        tyreId: installedTyreId
                    }
                });
            }

            // 4. Update status Tyre yang dilepas
            if (removedTyreId) {
                await tx.tyre.update({
                    where: { id: removedTyreId },
                    data: {
                        tread1: tread1Remove ?? undefined,
                        tread2: tread2Remove ?? undefined,
                        isReady: false,
                        isInstalled: false,
                        installedUnitId: null,
                        positionTyre: null,
                        removedPurposeId: removePurposeId
                    }
                });
            }

            // 5. Update status Tyre yang dipasang
            if (installedTyreId) {
                await tx.tyre.update({
                    where: { id: installedTyreId },
                    data: {
                        tread1: tread1Install ?? undefined,
                        tread2: tread2Install ?? undefined,
                        isReady: false,
                        isInstalled: true,
                        installedUnitId: unitId,
                        positionTyre: positionToUse,
                        removedPurposeId: null
                    }
                });
            }

            // 6. Update Unit jika ada perubahan HM/KM/Location
            const unitUpdateData: any = {};
            if (unit.hmUnit !== hmAtActivity) unitUpdateData.hmUnit = hmAtActivity;
            if (unit.kmUnit !== kmAtActivity) unitUpdateData.kmUnit = kmAtActivity;
            if (location && unit.location !== location) unitUpdateData.location = location;
            if (Object.keys(unitUpdateData).length > 0) {
                await tx.unit.update({
                    where: { id: unitId },
                    data: unitUpdateData
                });
            }

            // 7. Simpan log aktivitas
            const newActivity = await tx.activityTyre.create({
                data: {
                    unitId,
                    hmAtActivity,
                    kmAtActivity,
                    location: location || undefined,
                    removedTyreId,
                    tread1Remove: tread1Remove ?? undefined,
                    tread2Remove: tread2Remove ?? undefined,
                    removeReasonId,
                    removePurposeId,
                    installedTyreId,
                    tread1Install: tread1Install ?? undefined,
                    tread2Install: tread2Install ?? undefined,
                    airConditionId,
                    airPressure,
                    manpower,
                    dateTimeWork: new Date(dateTimeWork),
                    dateTimeDone: dateTimeDone ? new Date(dateTimeDone) : null,
                    tyrePosition: positionToUse
                }
            });

            // 8. Jika ban dilepas, hitung total HM/KM pemakaian dan update ke ban
            if (removedTyreId) {
                const allInstalled = await tx.activityTyre.findMany({
                    where: {
                        installedTyreId: removedTyreId,
                        tyrePosition: positionToUse,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                const allRemoved = await tx.activityTyre.findMany({
                    where: {
                        removedTyreId: removedTyreId,
                        tyrePosition: positionToUse,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                // Ambil nilai oHM dan oKM dari StockTyre
                const tyreWithStock = await tx.tyre.findUnique({
                    where: { id: removedTyreId },
                    include: {
                        stockTyre: {
                            select: {
                                oHM: true,
                                oKM: true,
                            }
                        }
                    }
                });

                let totalHM = tyreWithStock?.stockTyre?.oHM || 0;
                let totalKM = tyreWithStock?.stockTyre?.oKM || 0;

                const len = Math.min(allInstalled.length, allRemoved.length);
                for (let i = 0; i < len; i++) {
                    const iHM = allInstalled[i].hmAtActivity || 0;
                    const rHM = allRemoved[i].hmAtActivity || 0;
                    totalHM += rHM - iHM;

                    const iKM = allInstalled[i].kmAtActivity || 0;
                    const rKM = allRemoved[i].kmAtActivity || 0;
                    totalKM += rKM - iKM;
                }

                await tx.tyre.update({
                    where: { id: removedTyreId },
                    data: {
                        hmTyre: totalHM,
                        kmTyre: totalKM,
                    }
                });
            }

            // 9. Buat InspectionTyre untuk ban yang dilepas/dipasang
            let installDate: Date | undefined = undefined;
            let removeDate: Date | undefined = undefined;

            if (removedTyreId) {
                const lastInstall = await tx.activityTyre.findFirst({
                    where: {
                        installedTyreId: removedTyreId,
                        unitId: unitId,
                        tyrePosition: positionToUse,
                    },
                    orderBy: { dateTimeWork: 'desc' },
                });

                installDate = lastInstall?.dateTimeWork ?? undefined;
                removeDate = dateTimeWork ? new Date(dateTimeWork) : new Date();
            }

            if (installedTyreId) {
                installDate = dateTimeWork ? new Date(dateTimeWork) : new Date();
            }

            const tyreForInspection = removedTyreId
                ? await tx.tyre.findUnique({ where: { id: removedTyreId } })
                : installedTyreId
                    ? await tx.tyre.findUnique({ where: { id: installedTyreId } })
                    : null;

            if (tyreForInspection) {
                await tx.inspectionTyre.create({
                    data: {
                        tyreId: tyreForInspection.id,
                        activityTyreId: newActivity.id,
                        unitId: newActivity.unitId || null,
                        positionTyre: positionToUse,
                        treadRemaining: tyreForInspection.tread1 ?? undefined,
                        ageTotal: tyreForInspection.hmTyre,
                        installDate,
                        removeDate,
                        removePurposeId: removePurposeId ?? undefined,
                        dateTimeIn: dateTimeWork ? new Date(dateTimeWork) : new Date(),
                        // ...field lain default/null
                    }
                });
            }

            return newActivity;
        });

        res.status(201).json({ message: "Activity Created Successfully", result });
    } catch (error: any) {
        console.error("Failed to create activity:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};



