import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

// Prisma clients
const tyreClient = new PrismaClient().tyre;
const stockTyreClient = new PrismaClient().stockTyre;
const unitClient = new PrismaClient().unit;
const activityClient = new PrismaClient().activityTyre;
<<<<<<< HEAD
const prismaClient = new PrismaClient();
=======
const prismaClient = new PrismaClient()
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a

/**
 * Ambil semua data Tyre beserta info penting.
 */
export const getAllTyre = async (req: Request, res: Response) => {
    try {
        const allTyresRaw = await tyreClient.findMany({
            select: {
                id: true,
                positionTyre: true,
<<<<<<< HEAD
                stockTyre: true,
=======
                stockTyre: {
                    select: {
                        id: true,
                        serialNumber: true,
                        merk: true,
                        tyreSize: true,
                    }
                },
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
                hmTyre: true,
                kmTyre: true,
                isInstalled: true,
                isReady: true,
                isScrap: true,
                tread1: true,
                tread2: true,
                installedUnit: true,
                removedPurpose: true,
<<<<<<< HEAD
            },
        });
=======
                // activities: {
                //     select: {
                //         dateTimeInstall: true,
                //         dateTimeRemove: true,
                //         hmAtActivity: true,
                //     },
                //     orderBy: {
                //         dateTimeInstall: "asc", // urutkan agar pasangan teratur
                //     },
                // },
            },
        });

        // const allTyre = allTyresRaw.map((tyre) => {
        //     const activities = tyre.activities;

        //     const installs = activities
        //         .filter(a => a.dateTimeInstall && a.hmAtActivity != null)
        //         .map(a => ({ date: new Date(a.dateTimeInstall!), hm: a.hmAtActivity! }))
        //         .sort((a, b) => a.date.getTime() - b.date.getTime());

        //     const removes = activities
        //         .filter(a => a.dateTimeRemove && a.hmAtActivity != null)
        //         .map(a => ({ date: new Date(a.dateTimeRemove!), hm: a.hmAtActivity! }))
        //         .sort((a, b) => a.date.getTime() - b.date.getTime());

        //     let hmTyre = 0;
        //     let removeIndex = 0;

        //     installs.forEach((install) => {
        //         while (removeIndex < removes.length && removes[removeIndex].date <= install.date) {
        //             removeIndex++;
        //         }

        //         if (removeIndex < removes.length) {
        //             const remove = removes[removeIndex];
        //             const diff = remove.hm - install.hm;
        //             if (diff > 0) {
        //                 hmTyre += diff;
        //             }
        //             removeIndex++;
        //         }
        //     });

        //     return {
        //         ...tyre,
        //         hmTyre,
        //     };
        // });

>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
        res.status(200).json({ data: allTyresRaw });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch tyres" });
    }
};

<<<<<<< HEAD
/**
 * Ambil semua data StockTyre beserta relasi penting.
 */
=======
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
export const getAllStockTyre = async (req: Request, res: Response) => {
    try {
        const allStockTyre = await stockTyreClient.findMany({
            select: {
                id: true,
                serialNumber: true,
                type: true,
                pattern: true,
                otd1: true,
                otd2: true,
                price: true,
                merk: true,
                tyreSize: true,
                tyre: true,
            }
<<<<<<< HEAD
        });
=======
        })
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
        res.status(200).json({ data: allStockTyre });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch stock tyres" });
    }
<<<<<<< HEAD
};

/**
 * Ambil detail StockTyre berdasarkan ID.
 */
export const getStockTyreById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid StockTyre ID" });
            return;
        }

        const stockTyre = await stockTyreClient.findUnique({
            where: { id },
            include: {
                merk: true,
                tyreSize: true,
                tyre: true
            }
        });

        if (!stockTyre) {
            res.status(404).json({ message: "StockTyre not found" });
            return;
        }

        res.status(200).json({ data: stockTyre });
    } catch (error: any) {
        console.error("Error fetching StockTyre by ID:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

/**
 * Membuat StockTyre dan Tyre baru secara atomik (transaction).
 * - Validasi serialNumber unik.
 * - Buat StockTyre, lalu Tyre yang terhubung.
 */
=======
}

//getTyreById
// export const getTyreById = async (req: Request, res: Response) => {
//     try {
//         const tyreId = Number(req.params.id);

//         const Tyre = await tyreClient.findUnique({
//             where: { id: tyreId },
//             select: {
//                 id: true,
//                 serialNumber: true,
//                 isInstalled: true,
//                 merk: true,
//                 tread1: true,
//                 tread2: true,
//                 tyreSize: true,
//                 installedUnit: true,
//                 removedPurpose: true,
//                 activities: {
//                     select: {
//                         dateTimeInstall: true,
//                         dateTimeRemove: true,
//                         hmAtActivity: true,
//                     },
//                 },
//             },
//         });

//         if (!Tyre) {
//             res.status(404).json({ message: "Tyre not found" });
//             return;
//         }

//         const activities = Tyre.activities;

//         const installs = activities
//             .filter(a => a.dateTimeInstall && a.hmAtActivity != null)
//             .map(a => ({ date: new Date(a.dateTimeInstall!), hm: a.hmAtActivity! }))
//             .sort((a, b) => a.date.getTime() - b.date.getTime());

//         const removes = activities
//             .filter(a => a.dateTimeRemove && a.hmAtActivity != null)
//             .map(a => ({ date: new Date(a.dateTimeRemove!), hm: a.hmAtActivity! }))
//             .sort((a, b) => a.date.getTime() - b.date.getTime());

//         let hmTyre = 0;
//         let removeIndex = 0;

//         installs.forEach((install) => {
//             while (removeIndex < removes.length && removes[removeIndex].date <= install.date) {
//                 removeIndex++;
//             }

//             if (removeIndex < removes.length) {
//                 const remove = removes[removeIndex];
//                 const diff = remove.hm - install.hm;
//                 if (diff > 0) {
//                     hmTyre += diff;
//                 }
//                 removeIndex++;
//             }
//         });

//         const finalResult = {
//             ...Tyre,
//             hmTyre,
//         };

//         res.status(200).json({ data: finalResult });
//     } catch (e) {
//         console.log(e);
//         res.status(500).json({ message: "Failed to get tyre" });
//     }
// };

// //getTyreBySN
// export const getTyreBySN = async (req: Request, res: Response) => {
//     try {
//         const tyreSerialNumber = req.params.sn
//         const Tyre = await tyreClient.findUnique({
//             select: {
//                 id: true,
//                 serialNumber: true,
//                 merk: true,
//                 tread1: true,
//                 tread2: true,
//                 tyreSize: {
//                     select: {
//                         size: true,
//                     },
//                 },
//             },
//             where: {
//                 serialNumber: tyreSerialNumber,
//             }
//         })
//         res.status(200).json({ data: Tyre })
//     } catch (e) {
//         console.log(e)
//     }
// }

>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
export const createTyre = async (req: Request, res: Response) => {
    try {
        const {
            serialNumber,
            merkId,
            type,
            pattern,
            otd1,
            otd2,
            price,
<<<<<<< HEAD
            tyreSizeId,
            oHM,
            oKM
        } = req.body;

        if (!serialNumber || !merkId || !tyreSizeId) {
            res.status(400).json({ message: 'serialNumber, merkId, and tyreSizeId are required' });
            return;
        }

        // Cek serialNumber unik
        const existingTyre = await stockTyreClient.findUnique({
            where: { serialNumber }
        });

        if (existingTyre) {
            res.status(409).json({ error: 'serialNumber already exists' });
            return;
        }

        // Transaction: buat StockTyre lalu Tyre
        const newTyre = await prismaClient.$transaction(async (tx) => {
            const newStockTyre = await tx.stockTyre.create({
                data: {
                    serialNumber,
                    merkId,
                    type,
                    pattern,
                    otd1,
                    otd2,
                    price,
                    tyreSizeId,
                    oHM: oHM ?? 0,
                    oKM: oKM ?? 0,
                }
            });

            const newTyre = await tx.tyre.create({
                data: {
                    stockTyreId: newStockTyre.id,
                    isReady: true,
                    tread1: otd1,
                    tread2: otd2,
                    hmTyre: oHM,
                    kmTyre: oKM,
                },
                include: {
                    stockTyre: true
                }
            });

            return newTyre;
        });

        res.status(201).json({ message: "Tyre Created Successfully", newTyre });
    } catch (error: any) {
        console.error('Error creating tyre + stockTyre:', error);

        if (error.code === 'P2002') {
            const target = error.meta?.target?.[0] || 'data';
            res.status(409).json({ error: `Duplicate ${target} found` });
            return;
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Update StockTyre dan sinkronisasi hmTyre/kmTyre pada Tyre terkait.
 * - Validasi ID dan serialNumber unik.
 * - Hitung ulang total HM/KM berdasarkan aktivitas.
 */
export const updateStockTyre = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            serialNumber,
            merkId,
            type,
            pattern,
            otd1,
            otd2,
            price,
            tyreSizeId,
            oHM,
            oKM
        } = req.body;

        const stockTyreId = Number(id);
        if (isNaN(stockTyreId)) {
            res.status(400).json({ message: 'Invalid stockTyre ID' });
            return;
        }

        const existing = await prismaClient.stockTyre.findUnique({ where: { id: stockTyreId } });
        if (!existing) {
            res.status(404).json({ message: 'StockTyre not found' });
            return;
        }

        // Cek serialNumber unik jika diubah
        if (serialNumber && serialNumber !== existing.serialNumber) {
            const duplicate = await prismaClient.stockTyre.findUnique({ where: { serialNumber } });
            if (duplicate) {
                res.status(409).json({ error: 'serialNumber already exists' });
                return;
            }
        }

        // Update StockTyre
        const updatedStockTyre = await prismaClient.stockTyre.update({
            where: { id: stockTyreId },
            data: {
                serialNumber,
                merkId,
                type,
                pattern,
                otd1,
                otd2,
                price,
                tyreSizeId,
                oHM,
                oKM,
            },
        });

        // Sinkronisasi HM/KM Tyre terkait
        const tyres = await prismaClient.tyre.findMany({
            where: { stockTyreId },
            select: { id: true }
        });

        for (const tyre of tyres) {
            const tyreId = tyre.id;

            // Ambil semua aktivitas pemasangan dan pelepasan untuk Tyre ini
            const installedActivities = await prismaClient.activityTyre.findMany({
                where: { installedTyreId: tyreId },
                orderBy: { dateTimeWork: 'asc' }
            });

            const removedActivities = await prismaClient.activityTyre.findMany({
                where: { removedTyreId: tyreId },
                orderBy: { dateTimeWork: 'asc' }
            });

            let totalHM = 0;
            let totalKM = 0;
            const len = Math.min(installedActivities.length, removedActivities.length);

            for (let i = 0; i < len; i++) {
                const iHM = installedActivities[i].hmAtActivity || 0;
                const rHM = removedActivities[i].hmAtActivity || 0;
                totalHM += Math.max(rHM - iHM, 0);

                const iKM = installedActivities[i].kmAtActivity || 0;
                const rKM = removedActivities[i].kmAtActivity || 0;
                totalKM += Math.max(rKM - iKM, 0);
            }

            // Tambahkan nilai awal dari stockTyre
            const finalHM = totalHM + (oHM || 0);
            const finalKM = totalKM + (oKM || 0);

            // Update hmTyre dan kmTyre
            await prismaClient.tyre.update({
                where: { id: tyreId },
                data: {
                    hmTyre: finalHM,
                    kmTyre: finalKM,
                }
            });
        }

        res.status(200).json({
            message: "StockTyre and related Tyre(s) updated successfully",
            data: updatedStockTyre
        });
    } catch (error: any) {
        console.error('Error updating StockTyre:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

/**
 * Hapus Tyre berdasarkan ID.
 * - Validasi ID.
 */
=======
            tyreSizeId
        } = req.body

        if (!serialNumber || !merkId || !tyreSizeId) {
            res.status(400).json({ message: 'serialNumber, merkId, and tyreSizeId are required' })
            return
        }

        // First check if serialNumber already exists to provide a more specific error message
        const existingTyre = await stockTyreClient.findUnique({
            where: { serialNumber }
        })

        if (existingTyre) {
            res.status(409).json({ error: 'serialNumber already exists' })
            return
        }

        // Create both StockTyre and Tyre in a transaction to ensure data consistency
        const newTyre = await prismaClient.$transaction(async (tx) => {
            // First create StockTyre
            const newStockTyre = await tx.stockTyre.create({
                data: {
                    serialNumber,
                    merkId,
                    type,
                    pattern,
                    otd1,
                    otd2,
                    price,
                    tyreSizeId,
                }
            })

            // Then create Tyre with reference to the new StockTyre
            const newTyre = await tx.tyre.create({
                data: {
                    stockTyreId: newStockTyre.id,
                    isReady: true,
                    tread1: otd1,
                    tread2: otd2
                },
                include: {
                    stockTyre: true
                }
            })

            return newTyre
        })

        res.status(201).json({ message: "Tyre Created Successfully", newTyre })
    } catch (error: any) {
        console.error('Error creating tyre + stockTyre:', error)

        if (error.code === 'P2002') {
            // Extract the constraint field name from the error for a more specific message
            const target = error.meta?.target?.[0] || 'data'
            res.status(409).json({ error: `Duplicate ${target} found` })
            return
        }

        res.status(500).json({ error: 'Internal Server Error' })
        return
    }
}

//createTyre
// export const createTyre = async (req: Request, res: Response) => {
//     try {
//         const {
//             serialNumber,     // wajib
//             tyreSizeId,       // wajib
//             isInstalled,      // wajib
//             activityTypeId,   // wajib (diambil dari isInstalled)

//             merk,     // opsional
//             manpower, // opsional
//             tread1,   // opsional
//             tread2,   // opsional

//             unitId,          // wajib jika isInstalled = true
//             positionTyre,    // wajib jika isInstalled = true
//             dateTimeInstall, // wajib jika isInstalled = true
//             siteId,          // default dari unitId
//             location,        // default dari unitId
//             hmUnit,          // default dari unitId
//             airConditionId,  // opsional jika isInstalled = true
//             airPressure,     // opsional jika isInstalled = true

//             removedPurposeId, // wajib jika isInstalled = false
//             dateTimeRemove,   // wajib jika isInstalled = false
//             removeReasonId    // opsional jika isInstalled = false


//         } = req.body;

//         const existingSerial = await tyreClient.findFirst({
//             where: {
//                 serialNumber,
//                 NOT: { serialNumber: serialNumber },
//             },
//         });

//         if (existingSerial) {
//             res.status(400).json({
//                 message: "Serial number already exists for another tyre",
//                 field: "serialNumber",
//             });
//             return
//         }

//         // 🔍 Cek apakah kombinasi installedUnitId dan positionTyre sudah digunakan oleh ban lain
//         if (unitId && positionTyre) {
//             const existingPositionConflict = await tyreClient.findFirst({
//                 where: {
//                     installedUnitId: unitId,
//                     positionTyre,
//                     NOT: { serialNumber },
//                 },
//             });

//             if (existingPositionConflict) {
//                 res.status(400).json({
//                     message: "This position is already occupied in the selected unit",
//                     field: "positionTyre",
//                 });
//                 return
//             }
//         }

//         if (!serialNumber || !tyreSizeId) {
//             res.status(400).json({ message: "serialNumber and tyreSizeId are required" });
//             return
//         }

//         if (isInstalled) {
//             if (!unitId || typeof positionTyre !== "number" || !dateTimeInstall) {
//                 res.status(400).json({ message: "unitId, positionTyre, and dateTimeInstall are required when tyre is installed" });
//                 return
//             }
//         } else {
//             if (!removedPurposeId || !dateTimeRemove) {
//                 res.status(400).json({ message: "removedPurposeId and dateTimeRemove are required when tyre is not installed" });
//                 return
//             }
//         }

//         // Cek apakah posisi pada unit sudah terisi
//         if (isInstalled && unitId && typeof positionTyre === "number") {
//             const existingTyre = await tyreClient.findFirst({
//                 where: {
//                     installedUnitId: unitId,
//                     positionTyre: positionTyre,
//                     isInstalled: true,
//                 },
//             });

//             if (existingTyre) {
//                 res.status(400).json({ message: "Another tyre is already installed in the same unit and position." });
//                 return
//             }
//         }

//         let finalHmUnit: number | null = null;
//         let finalSiteId: number | null = null;
//         let finalLocation: string | null = null;
//         if (isInstalled && unitId) {
//             const unit = await unitClient.findUnique({
//                 where: { id: unitId },
//                 select: { hmUnit: true, siteId: true, location: true },
//             });

//             if (!unit) {
//                 res.status(404).json({ message: "Unit not found" });
//                 return
//             }

//             // Tentukan nilai finalHmUnit
//             finalHmUnit = typeof hmUnit === "number" ? hmUnit : unit.hmUnit;

//             // Tentukan nilai finalSiteId dan finalLocation
//             finalSiteId = typeof siteId === "number" ? siteId : unit.siteId;
//             finalLocation = typeof location === "string" ? location : unit.location;

//             // Update Unit
//             await unitClient.update({
//                 where: { id: unitId },
//                 data: {
//                     hmUnit: finalHmUnit,
//                     siteId: finalSiteId,
//                     location: finalLocation,
//                 },
//             });
//         }

//         // Siapkan data aktivitas
//         const activityData: any = {
//             unitId: unitId ?? null,
//             manpower: manpower ?? null,
//             positionTyre: isInstalled ? positionTyre : null,
//             hmAtActivity: finalHmUnit ?? 0,
//             removePurposeId: !isInstalled ? removedPurposeId : undefined,
//             removeReasonId: !isInstalled ? removeReasonId : undefined,
//             dateTimeInstall: isInstalled ? new Date(dateTimeInstall) : undefined,
//             dateTimeRemove: !isInstalled ? new Date(dateTimeRemove) : undefined,
//             airConditionId: airConditionId ?? undefined,
//             airPressure: airPressure ?? undefined,
//             activityTypeId: activityTypeId ?? (isInstalled ? 1 : 2), // fallback default INSTALL = 1, REMOVE = 2
//             tread1SaatPasang: isInstalled && tread1 != null ? tread1 : undefined,
//             tread2SaatPasang: isInstalled && tread2 != null ? tread2 : undefined,
//             tread1SaatRemove: !isInstalled && tread1 != null ? tread1 : undefined,
//             tread2SaatRemove: !isInstalled && tread2 != null ? tread2 : undefined,
//         };

//         // Siapkan data ban
//         const tyreData: any = {
//             serialNumber,
//             merk: merk ?? null,
//             tread1: tread1 ?? null,
//             tread2: tread2 ?? null,
//             isInstalled,
//             tyreSize: {
//                 connect: { id: tyreSizeId },
//             },
//             installedUnit: isInstalled ? { connect: { id: unitId } } : undefined,
//             positionTyre: isInstalled ? positionTyre : null,
//             removedPurpose: !isInstalled ? { connect: { id: removedPurposeId } } : undefined,
//             activities: {
//                 create: activityData,
//             },
//         };

//         const newTyre = await tyreClient.create({ data: tyreData });
//         res.status(201).json({ message: "tyre created Successfully", data: newTyre });
//     } catch (error: any) {
//         console.error("Error updating tyre:", error);

//         // Prisma-specific error handling (fallback)
//         if (error.code === "P2002") {
//             const targetField = error.meta?.target?.toString() || "unknown";
//             res.status(400).json({
//                 message: `Unique constraint violation on field: ${targetField}`,
//             });
//             return
//         }
//         res.status(500).json({ message: "Failed to create tyre" });
//     }
// };

//updateTyre
// export const updateTyre = async (req: Request, res: Response) => {
//     try {
//         const {
//             serialNumber,
//             tyreSizeId,
//             isInstalled,
//             activityTypeId,

//             merk,
//             manpower,
//             tread1,
//             tread2,

//             unitId,
//             positionTyre,
//             siteId,
//             location,
//             dateTimeInstall,
//             hmUnit,
//             airConditionId,
//             airPressure,

//             removedPurposeId,
//             dateTimeRemove,
//             removeReasonId,
//         } = req.body;
//         const tyreId = Number(req.params.id);

//         const existingSerial = await tyreClient.findFirst({
//             where: {
//                 serialNumber,
//                 NOT: { serialNumber: serialNumber },
//             },
//         });

//         if (existingSerial) {
//             res.status(400).json({
//                 message: "Serial number already exists for another tyre",
//                 field: "serialNumber",
//             });
//             return
//         }

//         // 🔍 Cek apakah kombinasi installedUnitId dan positionTyre sudah digunakan oleh ban lain
//         if (unitId && positionTyre) {
//             const existingPositionConflict = await tyreClient.findFirst({
//                 where: {
//                     installedUnitId: unitId,
//                     positionTyre,
//                     NOT: { serialNumber },
//                 },
//             });

//             if (existingPositionConflict) {
//                 res.status(400).json({
//                     message: "This position is already occupied in the selected unit",
//                     field: "positionTyre",
//                 });
//                 return
//             }
//         }

//         if (!tyreId) {
//             res.status(400).json({ message: "Tyre ID is required in params" });
//             return
//         }

//         if (!serialNumber || !tyreSizeId) {
//             res.status(400).json({ message: "serialNumber and tyreSizeId are required" });
//             return
//         }

//         if (isInstalled) {
//             if (!unitId || typeof positionTyre !== "number" || !dateTimeInstall) {
//                 res.status(400).json({ message: "unitId, positionTyre, and dateTimeInstall are required when installing a tyre" });
//                 return
//             }
//         } else {
//             if (!removedPurposeId || !dateTimeRemove) {
//                 res.status(400).json({ message: "removedPurposeId and dateTimeRemove are required when removing a tyre" });
//                 return
//             }
//         }

//         // Ambil data unit
//         let finalHmUnit: number | null = null;
//         let finalSiteId: number | null = null;
//         let finalLocation: string | null = null;

//         if (unitId) {
//             const unit = await unitClient.findUnique({
//                 where: { id: unitId },
//                 select: { hmUnit: true, siteId: true, location: true },
//             });

//             if (!unit) {
//                 res.status(404).json({ message: "Unit not found" });
//                 return;
//             }

//             // Ambil data dari input jika ada, jika tidak pakai default unit
//             finalHmUnit = typeof hmUnit === "number" ? hmUnit : unit.hmUnit;
//             finalSiteId = typeof siteId === "number" ? siteId : unit.siteId;
//             finalLocation = typeof location === "string" ? location : unit.location;

//             // Update unit
//             await unitClient.update({
//                 where: { id: unitId },
//                 data: {
//                     hmUnit: finalHmUnit,
//                     siteId: finalSiteId,
//                     location: finalLocation,
//                 },
//             });
//         }

//         // Update data tyre, nullkan yg gak perlu
//         const updatedTyre = await tyreClient.update({
//             where: { id: tyreId },
//             data: {
//                 serialNumber,
//                 merk: merk ?? null,
//                 tread1: tread1 ?? null,
//                 tread2: tread2 ?? null,
//                 isInstalled,
//                 tyreSize: { connect: { id: tyreSizeId } },
//                 installedUnit: isInstalled ? { connect: { id: unitId } } : undefined,
//                 positionTyre: isInstalled ? positionTyre : null,
//                 removedPurpose: !isInstalled ? { connect: { id: removedPurposeId } } : undefined,
//                 ...(isInstalled
//                     ? {}
//                     : {
//                         installedUnit: { disconnect: true },
//                         positionTyre: null,
//                     }),
//             },
//         });

//         // Buat activity baru
//         await activityClient.create({
//             data: {
//                 tyreId,
//                 unitId: unitId ?? null,
//                 manpower: manpower ?? null,
//                 positionTyre: isInstalled ? positionTyre : null,
//                 hmAtActivity: finalHmUnit ?? 0,
//                 dateTimeInstall: isInstalled ? new Date(dateTimeInstall) : null,
//                 dateTimeRemove: !isInstalled ? new Date(dateTimeRemove) : null,
//                 removePurposeId: !isInstalled ? removedPurposeId : null,
//                 removeReasonId: !isInstalled ? removeReasonId : null,
//                 airConditionId: airConditionId ?? null,
//                 airPressure: airPressure ?? null,
//                 activityTypeId: activityTypeId ?? (isInstalled ? 1 : 2),
//                 tread1SaatPasang: isInstalled && tread1 != null ? tread1 : null,
//                 tread2SaatPasang: isInstalled && tread2 != null ? tread2 : null,
//                 tread1SaatRemove: !isInstalled && tread1 != null ? tread1 : null,
//                 tread2SaatRemove: !isInstalled && tread2 != null ? tread2 : null,
//             },
//         });

//         res.status(200).json({
//             message: "Tyre updated successfully with new activity",
//             data: updatedTyre,
//         });
//     } catch (error: any) {
//         console.error("Error updating tyre:", error);

//         // Prisma-specific error handling (fallback)
//         if (error.code === "P2002") {
//             const targetField = error.meta?.target?.toString() || "unknown";
//             res.status(400).json({
//                 message: `Unique constraint violation on field: ${targetField}`,
//             });
//             return
//         }
//         res.status(500).json({ message: "Failed to update tyre" });
//     }
// };


// //deleteTyre
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
export const deleteTyre = async (req: Request, res: Response) => {
    const tyreId = Number(req.params.id);
    if (isNaN(tyreId)) {
        res.status(400).json({ error: "Invalid tyre ID" });
        return;
    }
    try {
        await tyreClient.delete({
            where: { id: tyreId },
        });

        res.status(200).json({ message: "Tyre deleted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete tyre" });
    }
};