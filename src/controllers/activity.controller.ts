import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";


const activityClient = new PrismaClient().activityTyre;
const tyreClient = new PrismaClient().tyre
const prismaClient = new PrismaClient();

//getAllActivity
export const getAllActivityTyre = async (req: Request, res: Response) => {
    try {
        const activities = await activityClient.findMany({
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
                airCondition: true
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
            tyrePosition, // ← dari frontend
        } = req.body;

        const result = await prismaClient.$transaction(async (tx) => {
            // 1. Validasi Unit
            const unit = await tx.unit.findUnique({
                where: { id: unitId },
                select: {
                    id: true,
                    location: true,
                    hmUnit: true,
                    kmUnit: true,
                    tyre1Id: true,
                    tyre2Id: true,
                    tyre3Id: true,
                    tyre4Id: true,
                    tyre5Id: true,
                    tyre6Id: true,
                }
            });
            if (!unit) throw new Error("Unit not found");

            // 2. Tentukan posisi ban yang dilepas dari data unit
            const tyreFields = ['tyre1Id', 'tyre2Id', 'tyre3Id', 'tyre4Id', 'tyre5Id', 'tyre6Id'];
            const removedTyreIdNum = Number(removedTyreId);
            let positionFromUnit: number | null = null;

            for (let i = 0; i < tyreFields.length; i++) {
                const field = tyreFields[i] as keyof typeof unit;
                const currentTyreId = unit[field];

                if (currentTyreId === removedTyreIdNum) {
                    // Ban dilepas ditemukan di posisi ini
                    positionFromUnit = i + 1;
                    break;
                }

                if (!currentTyreId && positionFromUnit === null) {
                    // Jika belum dapat posisi, catat posisi kosong pertama
                    positionFromUnit = i + 1;
                }
            }
            if (positionFromUnit === null) {
                throw new Error("Removed tyre is not currently installed in this unit");
            }

            // Pilih posisi ban:
            const finalTyrePosition = positionFromUnit ?? tyrePosition ?? null;
            console.log(positionFromUnit, finalTyrePosition)

            // Siapkan data untuk update unit
            const unitUpdateData: any = {};
            if (unit.hmUnit !== hmAtActivity) unitUpdateData.hmUnit = hmAtActivity;
            if (unit.kmUnit !== kmAtActivity) unitUpdateData.kmUnit = kmAtActivity;
            if (location) {
                if (unit.location !== location) {
                    unitUpdateData.location = location;
                }
            } else {
                unitUpdateData.location = unit.location;
            }

            // Set posisi ban (dipasang atau dilepas)
            if (finalTyrePosition) {
                const fieldName = `tyre${finalTyrePosition}Id`;
                unitUpdateData[fieldName] = installedTyreId ?? null;
            }

            if (Object.keys(unitUpdateData).length > 0) {
                await tx.unit.update({
                    where: { id: unitId },
                    data: unitUpdateData,
                });
            }

            // Ambil data ban dilepas & dipasang
            const removedTyre = removedTyreId ? await tx.tyre.findUnique({ where: { id: removedTyreId } }) : null;
            const installedTyre = installedTyreId ? await tx.tyre.findUnique({ where: { id: installedTyreId } }) : null;

            // Tentukan nilai tread akhir
            const finalTread1Remove = tread1Remove ?? removedTyre?.tread1 ?? null;
            const finalTread2Remove = tread2Remove ?? removedTyre?.tread2 ?? null;
            const finalTread1Install = tread1Install ?? installedTyre?.tread1 ?? null;
            const finalTread2Install = tread2Install ?? installedTyre?.tread2 ?? null;

            // 3. Update status ban yang dilepas
            if (removedTyreId) {
                await tx.tyre.update({
                    where: { id: removedTyreId },
                    data: {
                        tread1: finalTread1Remove,
                        tread2: finalTread2Remove,
                        isReady: false, // nanti diganti ke false harus melalui inpeksi
                        isInstalled: false,
                        installedUnitId: null,
                        positionTyre: null,
                        removedPurposeId: removePurposeId
                    },
                });
            }

            // 4. Update status ban yang dipasang
            if (installedTyreId) {
                await tx.tyre.update({
                    where: { id: installedTyreId },
                    data: {
                        tread1: finalTread1Install,
                        tread2: finalTread2Install,
                        isReady: false,
                        isInstalled: true,
                        installedUnitId: unitId,
                        positionTyre: finalTyrePosition,
                        removedPurposeId: null
                    },
                });
            }

            // 5. Simpan log aktivitas
            const newActivity = await tx.activityTyre.create({
                data: {
                    unitId,
                    hmAtActivity,
                    kmAtActivity,
                    location: location || undefined,
                    removedTyreId,
                    tread1Remove: finalTread1Remove,
                    tread2Remove: finalTread2Remove,
                    removeReasonId,
                    removePurposeId,
                    installedTyreId,
                    tread1Install: finalTread1Install,
                    tread2Install: finalTread2Install,
                    airConditionId,
                    airPressure,
                    manpower,
                    dateTimeWork: new Date(dateTimeWork),
                    dateTimeDone: dateTimeDone ? new Date(dateTimeDone) : null,
                    tyrePosition: finalTyrePosition,
                },
            });
            // 6. Jika ban dilepas, hitung total HM/KM pemakaian dan update ke ban
            if (removedTyreId) {
                const allInstalled = await tx.activityTyre.findMany({
                    where: {
                        installedTyreId: removedTyreId,
                        tyrePosition: finalTyrePosition,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                const allRemoved = await tx.activityTyre.findMany({
                    where: {
                        removedTyreId: removedTyreId,
                        tyrePosition: finalTyrePosition,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                let totalHM = 0;
                let totalKM = 0;

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

            let installDate: Date | undefined = undefined;
            let removeDate: Date | undefined = undefined;

            if (removedTyreId) {
                // Cari activity sebelumnya yang memasang ban ini (untuk installDate)
                const lastInstall = await tx.activityTyre.findFirst({
                    where: {
                        installedTyreId: removedTyreId,
                        unitId: unitId,
                        tyrePosition: finalTyrePosition,
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
            console.log(positionFromUnit, finalTyrePosition)
            if (tyreForInspection) {
                await tx.inspectionTyre.create({
                    data: {
                        tyreId: tyreForInspection.id,
                        activityTyreId: newActivity.id,
                        unitId: newActivity.unitId || null, // atau ambil dari unit.number jika ada relasi
                        positionTyre: finalTyrePosition,

                        removeReason: undefined, // Bisa diisi dari removeReasonId jika lookup sudah ada
                        removePurpose: undefined,

                        treadRemaining: tyreForInspection.tread1 ?? undefined, // contoh pakai tread1
                        treadValue: undefined,

                        ageTotal: tyreForInspection.hmTyre,
                        installDate,
                        removeDate,

                        ageFront: undefined,
                        ageRear: undefined,

                        incidentNote: null,
                        analysisNote: null,

                        removePurposeId: removePurposeId ?? undefined,
                        inspectedBy: null,

                        dateTimeIn: dateTimeWork ? new Date(dateTimeWork) : new Date(),
                        dateTimeWork: undefined,
                    },
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






// //getActivityByTyreId
// export const getActivityByTyreId = async (req: Request, res: Response) => {
//     const tyreId = Number(req.params.id);
//     try {
//         const activities = await activityClient.findMany({
//             where: {
//                 tyreId: tyreId,
//             },
//             include: {
//                 tyre: true,
//                 unit: true,
//                 activityType: true,
//                 removePurpose: true,
//                 // RemoveReason: true,
//                 airCondition: true,
//             },
//             orderBy: {
//                 id: 'desc',
//             },
//         });

//         if (!activities || activities.length === 0) {
//             res.status(404).json({ message: 'No activity found for this tyreId' });
//         } else {
//             res.status(200).json({ data: activities });
//         }

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to fetch activities by tyreId' });
//     }
// };

// //createActivity
// export const createActivity = async (req: Request, res: Response) => {
//     try {
//         const {
//             tyreId,
//             unitId,
//             activityTypeId,
//             removePurposeId,
//             removeReasonId,
//             airConditionId,
//             positionTyre,
//             manpower,
//             dateTimeRemove,
//             dateTimeInstall,
//             hmAtActivity,
//             tread1SaatRemove,
//             tread2SaatRemove,
//             removeReason,
//             tread1SaatPasang,
//             tread2SaatPasang,
//         } = req.body;

//         const newActivity = await activityClient.create({
//             data: {
//                 tyreId,
//                 unitId,
//                 activityTypeId,
//                 removePurposeId,
//                 removeReasonId,
//                 airConditionId,
//                 positionTyre,
//                 manpower,
//                 dateTimeRemove: dateTimeRemove ? new Date(dateTimeRemove) : null,
//                 dateTimeInstall: dateTimeInstall ? new Date(dateTimeInstall) : null,
//                 hmAtActivity,
//                 tread1SaatRemove,
//                 tread2SaatRemove,
//                 tread1SaatPasang,
//                 tread2SaatPasang,
//                 removeReason,
//             },
//         });

//         res.status(201).json({ message: "Activity created successfully", data: newActivity });
//     } catch (error) {
//         console.error("Failed to create activity:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// //updateActivity
// export const updateActivity = async (req: Request, res: Response) => {
//     const activityId = Number(req.params.id);
//     const {
//         tyreId,
//         unitId,
//         activityTypeId,
//         removePurposeId,
//         removeReasonId,
//         airConditionId,
//         positionTyre,
//         manpower,
//         dateTimeRemove,
//         dateTimeInstall,
//         hmAtActivity,
//         tread1SaatRemove,
//         tread2SaatRemove,
//         removeReason,
//         tread1SaatPasang,
//         tread2SaatPasang,
//     } = req.body;

//     try {
//         const updatedActivity = await activityClient.update({
//             where: { id: activityId },
//             data: {
//                 tyreId,
//                 unitId,
//                 activityTypeId,
//                 removePurposeId,
//                 removeReasonId,
//                 airConditionId,
//                 positionTyre,
//                 manpower,
//                 hmAtActivity,
//                 tread1SaatRemove,
//                 tread2SaatRemove,
//                 removeReason,
//                 dateTimeRemove,
//                 tread1SaatPasang,
//                 tread2SaatPasang,
//                 dateTimeInstall,
//             },
//             include: {
//                 tyre: true,
//                 unit: true,
//                 activityType: true,
//                 removePurpose: true,
//                 removeReason: true,
//                 airCondition: true,
//             },
//         });

//         res.status(200).json({ message: 'Activity updated successfully', data: updatedActivity });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to update activity' });
//     }
// };

// //deleteActivity



