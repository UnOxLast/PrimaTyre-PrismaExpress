import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { connect } from "http2";


const tyreClient = new PrismaClient().tyre;
const unitClient = new PrismaClient().unit;
const activityClient = new PrismaClient().activity;

export const getAllTyre = async (req: Request, res: Response) => {
    try {
        const allTyresRaw = await tyreClient.findMany({
            select: {
                id: true,
                serialNumber: true,
                isInstalled: true,
                merk: true,
                tread1: true,
                tread2: true,
                tyreSize: true,
                installedUnit: true,
                removedPurpose: true,
                activities: {
                    select: {
                        dateTimeInstall: true,
                        dateTimeRemove: true,
                        hmAtActivity: true,
                    },
                    orderBy: {
                        dateTimeInstall: "asc", // urutkan agar pasangan teratur
                    },
                },
            },
        });

        const allTyre = allTyresRaw.map((tyre) => {
            const activities = tyre.activities;

            const installs = activities
                .filter(a => a.dateTimeInstall && a.hmAtActivity != null)
                .map(a => ({ date: new Date(a.dateTimeInstall!), hm: a.hmAtActivity! }))
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            const removes = activities
                .filter(a => a.dateTimeRemove && a.hmAtActivity != null)
                .map(a => ({ date: new Date(a.dateTimeRemove!), hm: a.hmAtActivity! }))
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            let hmTyre = 0;
            let removeIndex = 0;

            installs.forEach((install) => {
                while (removeIndex < removes.length && removes[removeIndex].date <= install.date) {
                    removeIndex++;
                }

                if (removeIndex < removes.length) {
                    const remove = removes[removeIndex];
                    const diff = remove.hm - install.hm;
                    if (diff > 0) {
                        hmTyre += diff;
                    }
                    removeIndex++;
                }
            });

            return {
                ...tyre,
                hmTyre,
            };
        });

        res.status(200).json({ data: allTyre });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch tyres" });
    }
};

//getTyreById
export const getTyreById = async (req: Request, res: Response) => {
    try {
        const tyreId = Number(req.params.id);

        const Tyre = await tyreClient.findUnique({
            where: { id: tyreId },
            select: {
                id: true,
                serialNumber: true,
                isInstalled: true,
                merk: true,
                tread1: true,
                tread2: true,
                tyreSize: true,
                installedUnit: true,
                removedPurpose: true,
                activities: {
                    select: {
                        dateTimeInstall: true,
                        dateTimeRemove: true,
                        hmAtActivity: true,
                    },
                },
            },
        });

        if (!Tyre) {
            res.status(404).json({ message: "Tyre not found" });
            return;
        }

        const activities = Tyre.activities;

        const installs = activities
            .filter(a => a.dateTimeInstall && a.hmAtActivity != null)
            .map(a => ({ date: new Date(a.dateTimeInstall!), hm: a.hmAtActivity! }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const removes = activities
            .filter(a => a.dateTimeRemove && a.hmAtActivity != null)
            .map(a => ({ date: new Date(a.dateTimeRemove!), hm: a.hmAtActivity! }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        let hmTyre = 0;
        let removeIndex = 0;

        installs.forEach((install) => {
            while (removeIndex < removes.length && removes[removeIndex].date <= install.date) {
                removeIndex++;
            }

            if (removeIndex < removes.length) {
                const remove = removes[removeIndex];
                const diff = remove.hm - install.hm;
                if (diff > 0) {
                    hmTyre += diff;
                }
                removeIndex++;
            }
        });

        const finalResult = {
            ...Tyre,
            hmTyre,
        };

        res.status(200).json({ data: finalResult });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to get tyre" });
    }
};


//getTyreBySN
export const getTyreBySN = async (req: Request, res: Response) => {
    try {
        const tyreSerialNumber = req.params.sn
        const Tyre = await tyreClient.findUnique({
            select: {
                id: true,
                serialNumber: true,
                merk: true,
                tread1: true,
                tread2: true,
                tyreSize: {
                    select: {
                        size: true,
                    },
                },
            },
            where: {
                serialNumber: tyreSerialNumber,
            }
        })
        res.status(200).json({ data: Tyre })
    } catch (e) {
        console.log(e)
    }
}

//createTyre
export const createTyre = async (req: Request, res: Response) => {
    try {
        const {
            serialNumber,     // wajib
            tyreSizeId,       // wajib
            isInstalled,      // wajib
            activityTypeId,   // wajib (diambil dari isInstalled)

            merk,     // opsional
            manpower, // opsional
            tread1,   // opsional
            tread2,   // opsional

            unitId,          // wajib jika isInstalled = true
            positionTyre,    // wajib jika isInstalled = true
            dateTimeInstall, // wajib jika isInstalled = true
            siteId,          // default dari unitId
            location,        // default dari unitId
            hmUnit,          // default dari unitId
            airConditionId,  // opsional jika isInstalled = true
            airPressure,     // opsional jika isInstalled = true

            removedPurposeId, // wajib jika isInstalled = false
            dateTimeRemove,   // wajib jika isInstalled = false
            removeReasonId    // opsional jika isInstalled = false


        } = req.body;

        const existingSerial = await tyreClient.findFirst({
            where: {
                serialNumber,
                NOT: { serialNumber: serialNumber },
            },
        });

        if (existingSerial) {
            res.status(400).json({
                message: "Serial number already exists for another tyre",
                field: "serialNumber",
            });
            return
        }

        // 🔍 Cek apakah kombinasi installedUnitId dan positionTyre sudah digunakan oleh ban lain
        if (unitId && positionTyre) {
            const existingPositionConflict = await tyreClient.findFirst({
                where: {
                    installedUnitId: unitId,
                    positionTyre,
                    NOT: { serialNumber },
                },
            });

            if (existingPositionConflict) {
                res.status(400).json({
                    message: "This position is already occupied in the selected unit",
                    field: "positionTyre",
                });
                return
            }
        }

        if (!serialNumber || !tyreSizeId) {
            res.status(400).json({ message: "serialNumber and tyreSizeId are required" });
            return
        }

        if (isInstalled) {
            if (!unitId || typeof positionTyre !== "number" || !dateTimeInstall) {
                res.status(400).json({ message: "unitId, positionTyre, and dateTimeInstall are required when tyre is installed" });
                return
            }
        } else {
            if (!removedPurposeId || !dateTimeRemove) {
                res.status(400).json({ message: "removedPurposeId and dateTimeRemove are required when tyre is not installed" });
                return
            }
        }

        // Cek apakah posisi pada unit sudah terisi
        if (isInstalled && unitId && typeof positionTyre === "number") {
            const existingTyre = await tyreClient.findFirst({
                where: {
                    installedUnitId: unitId,
                    positionTyre: positionTyre,
                    isInstalled: true,
                },
            });

            if (existingTyre) {
                res.status(400).json({ message: "Another tyre is already installed in the same unit and position." });
                return
            }
        }

        let finalHmUnit: number | null = null;
        let finalSiteId: number | null = null;
        let finalLocation: string | null = null;
        if (isInstalled && unitId) {
            const unit = await unitClient.findUnique({
                where: { id: unitId },
                select: { hmUnit: true, siteId: true, location: true },
            });

            if (!unit) {
                res.status(404).json({ message: "Unit not found" });
                return
            }

            // Tentukan nilai finalHmUnit
            finalHmUnit = typeof hmUnit === "number" ? hmUnit : unit.hmUnit;

            // Tentukan nilai finalSiteId dan finalLocation
            finalSiteId = typeof siteId === "number" ? siteId : unit.siteId;
            finalLocation = typeof location === "string" ? location : unit.location;

            // Update Unit
            await unitClient.update({
                where: { id: unitId },
                data: {
                    hmUnit: finalHmUnit,
                    siteId: finalSiteId,
                    location: finalLocation,
                },
            });
        }

        // Siapkan data aktivitas
        const activityData: any = {
            unitId: unitId ?? null,
            manpower: manpower ?? null,
            positionTyre: isInstalled ? positionTyre : null,
            hmAtActivity: finalHmUnit ?? 0,
            removePurposeId: !isInstalled ? removedPurposeId : undefined,
            removeReasonId: !isInstalled ? removeReasonId : undefined,
            dateTimeInstall: isInstalled ? new Date(dateTimeInstall) : undefined,
            dateTimeRemove: !isInstalled ? new Date(dateTimeRemove) : undefined,
            airConditionId: airConditionId ?? undefined,
            airPressure: airPressure ?? undefined,
            activityTypeId: activityTypeId ?? (isInstalled ? 1 : 2), // fallback default INSTALL = 1, REMOVE = 2
            tread1SaatPasang: isInstalled && tread1 != null ? tread1 : undefined,
            tread2SaatPasang: isInstalled && tread2 != null ? tread2 : undefined,
            tread1SaatRemove: !isInstalled && tread1 != null ? tread1 : undefined,
            tread2SaatRemove: !isInstalled && tread2 != null ? tread2 : undefined,
        };

        // Siapkan data ban
        const tyreData: any = {
            serialNumber,
            merk: merk ?? null,
            tread1: tread1 ?? null,
            tread2: tread2 ?? null,
            isInstalled,
            tyreSize: {
                connect: { id: tyreSizeId },
            },
            installedUnit: isInstalled ? { connect: { id: unitId } } : undefined,
            positionTyre: isInstalled ? positionTyre : null,
            removedPurpose: !isInstalled ? { connect: { id: removedPurposeId } } : undefined,
            activities: {
                create: activityData,
            },
        };

        const newTyre = await tyreClient.create({ data: tyreData });
        res.status(201).json({ message: "tyre created Successfully", data: newTyre });
    } catch (error: any) {
        console.error("Error updating tyre:", error);

        // Prisma-specific error handling (fallback)
        if (error.code === "P2002") {
            const targetField = error.meta?.target?.toString() || "unknown";
            res.status(400).json({
                message: `Unique constraint violation on field: ${targetField}`,
            });
            return
        }
        res.status(500).json({ message: "Failed to create tyre" });
    }
};
//updateTyre
export const updateTyre = async (req: Request, res: Response) => {
    try {
        const {
            serialNumber,
            tyreSizeId,
            isInstalled,
            activityTypeId,

            merk,
            manpower,
            tread1,
            tread2,

            unitId,
            positionTyre,
            siteId,
            location,
            dateTimeInstall,
            hmUnit,
            airConditionId,
            airPressure,

            removedPurposeId,
            dateTimeRemove,
            removeReasonId,
        } = req.body;
        const tyreId = Number(req.params.id);

        const existingSerial = await tyreClient.findFirst({
            where: {
                serialNumber,
                NOT: { serialNumber: serialNumber },
            },
        });

        if (existingSerial) {
            res.status(400).json({
                message: "Serial number already exists for another tyre",
                field: "serialNumber",
            });
            return
        }

        // 🔍 Cek apakah kombinasi installedUnitId dan positionTyre sudah digunakan oleh ban lain
        if (unitId && positionTyre) {
            const existingPositionConflict = await tyreClient.findFirst({
                where: {
                    installedUnitId: unitId,
                    positionTyre,
                    NOT: { serialNumber },
                },
            });

            if (existingPositionConflict) {
                res.status(400).json({
                    message: "This position is already occupied in the selected unit",
                    field: "positionTyre",
                });
                return
            }
        }

        if (!tyreId) {
            res.status(400).json({ message: "Tyre ID is required in params" });
            return
        }

        if (!serialNumber || !tyreSizeId) {
            res.status(400).json({ message: "serialNumber and tyreSizeId are required" });
            return
        }

        if (isInstalled) {
            if (!unitId || typeof positionTyre !== "number" || !dateTimeInstall) {
                res.status(400).json({ message: "unitId, positionTyre, and dateTimeInstall are required when installing a tyre" });
                return
            }
        } else {
            if (!removedPurposeId || !dateTimeRemove) {
                res.status(400).json({ message: "removedPurposeId and dateTimeRemove are required when removing a tyre" });
                return
            }
        }

        // Ambil data unit
        let finalHmUnit: number | null = null;
        let finalSiteId: number | null = null;
        let finalLocation: string | null = null;

        if (unitId) {
            const unit = await unitClient.findUnique({
                where: { id: unitId },
                select: { hmUnit: true, siteId: true, location: true },
            });

            if (!unit) {
                res.status(404).json({ message: "Unit not found" });
                return;
            }

            // Ambil data dari input jika ada, jika tidak pakai default unit
            finalHmUnit = typeof hmUnit === "number" ? hmUnit : unit.hmUnit;
            finalSiteId = typeof siteId === "number" ? siteId : unit.siteId;
            finalLocation = typeof location === "string" ? location : unit.location;

            // Update unit
            await unitClient.update({
                where: { id: unitId },
                data: {
                    hmUnit: finalHmUnit,
                    siteId: finalSiteId,
                    location: finalLocation,
                },
            });
        }

        // Update data tyre, nullkan yg gak perlu
        const updatedTyre = await tyreClient.update({
            where: { id: tyreId },
            data: {
                serialNumber,
                merk: merk ?? null,
                tread1: tread1 ?? null,
                tread2: tread2 ?? null,
                isInstalled,
                tyreSize: { connect: { id: tyreSizeId } },
                installedUnit: isInstalled ? { connect: { id: unitId } } : undefined,
                positionTyre: isInstalled ? positionTyre : null,
                removedPurpose: !isInstalled ? { connect: { id: removedPurposeId } } : undefined,
                ...(isInstalled
                    ? {}
                    : {
                        installedUnit: { disconnect: true },
                        positionTyre: null,
                    }),
            },
        });

        // Buat activity baru
        await activityClient.create({
            data: {
                tyreId,
                unitId: unitId ?? null,
                manpower: manpower ?? null,
                positionTyre: isInstalled ? positionTyre : null,
                hmAtActivity: finalHmUnit ?? 0,
                dateTimeInstall: isInstalled ? new Date(dateTimeInstall) : null,
                dateTimeRemove: !isInstalled ? new Date(dateTimeRemove) : null,
                removePurposeId: !isInstalled ? removedPurposeId : null,
                removeReasonId: !isInstalled ? removeReasonId : null,
                airConditionId: airConditionId ?? null,
                airPressure: airPressure ?? null,
                activityTypeId: activityTypeId ?? (isInstalled ? 1 : 2),
                tread1SaatPasang: isInstalled && tread1 != null ? tread1 : null,
                tread2SaatPasang: isInstalled && tread2 != null ? tread2 : null,
                tread1SaatRemove: !isInstalled && tread1 != null ? tread1 : null,
                tread2SaatRemove: !isInstalled && tread2 != null ? tread2 : null,
            },
        });

        res.status(200).json({
            message: "Tyre updated successfully with new activity",
            data: updatedTyre,
        });
    } catch (error: any) {
        console.error("Error updating tyre:", error);

        // Prisma-specific error handling (fallback)
        if (error.code === "P2002") {
            const targetField = error.meta?.target?.toString() || "unknown";
            res.status(400).json({
                message: `Unique constraint violation on field: ${targetField}`,
            });
            return
        }
        res.status(500).json({ message: "Failed to update tyre" });
    }
};


//deleteTyre
export const deleteTyre = async (req: Request, res: Response) => {
    const tyreId = Number(req.params.id);
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