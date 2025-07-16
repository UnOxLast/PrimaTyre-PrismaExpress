import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const unitClient = new PrismaClient().unit;
const prismaClient = new PrismaClient();

//getAllUnit
export const getAllUnit = async (req: Request, res: Response) => {
    try {
        const units = await unitClient.findMany({
            include: {
                site: true,
                UnitTyreAmount: true,
                tyresInstalled: true
            }
        });

        if (!units) {
            res.status(404).json({ message: "No units found" });
            return;
        }

        res.status(200).json({ data: units });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch units" });
    }
}

//getUnitById
export const getUnitById = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id)
        const unit = await unitClient.findUnique({
            where: { id: unitId },
            include: {
                site: true,
                tyres: {
                    include: {
                        tyre: {
                            include: { stockTyre: true }
                        }
                    }
                }
            }
        });

        if (!unit) {
            res.status(404).json({ message: "Unit not found" });
            return
        }

        res.status(200).json({ data: unit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch unit" });
    }
};

//getUnitBySN
export const getUnitBySN = async (req: Request, res: Response) => {
    try {
        const SN = req.params.sn;
        const unit = await unitClient.findUnique({
            where: { nomorUnit: SN },
            include: {
                site: {
                    select: { name: true }
                }
            }
        });

        // if (!unit) {
        //     return res.status(404).json({ message: "Unit not found" });
        // }

        res.status(200).json({ data: unit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch unit" });
    }
};

/**
 * Membuat Unit baru dan mengaitkan ban-ban yang ditentukan (menggunakan stockTyreId dari input).
 * - Validasi input dasar.
 * - Validasi jumlah ban sesuai dengan unitTyreAmount.
 * - Mengkonversi stockTyreId menjadi Tyre.id dan memvalidasi setiap ban yang akan dipasang:
 * harus ada, tidak terhapus, tidak sedang terpasang, dan siap dipasang.
 * - Menggunakan transaction untuk memastikan atomicity.
 */
export const createUnit = async (req: Request, res: Response) => {
    try {
        const {
            nomorUnit,
            hmUnit,
            kmUnit,
            siteId,
            location,
            unitTyreAmountId,
            tyreIds: stockTyreIdsInput // Renamed for clarity: this array now contains stockTyreIds
        } = req.body;

        // --- 1. Basic Input Validation ---
        if (!nomorUnit || !siteId || !unitTyreAmountId) {
            res.status(400).json({ message: 'nomorUnit, siteId, and unitTyreAmountId are required' });
            return;
        }

        if (!Array.isArray(stockTyreIdsInput)) {
            res.status(400).json({ message: 'tyreIds must be an array' });
            return;
        }

        // --- 2. Validate UnitTyreAmount and tyreIds length ---
        const tyreAmountObj = await prismaClient.unitTyreAmount.findUnique({
            where: { id: unitTyreAmountId }
        });

        if (!tyreAmountObj) {
            res.status(400).json({ message: 'unitTyreAmountId not found' });
            return;
        }

        if (stockTyreIdsInput.length !== tyreAmountObj.amount) {
            res.status(400).json({ message: `Exactly ${tyreAmountObj.amount} tyre(s) must be provided for this unit type.` });
            return;
        }

        // --- 3. Convert stockTyreIds to Tyre.ids and Pre-validate each Tyre (CRITICAL) ---
        // Find the Tyre record for each provided stockTyreId, and include its status
        const tyresToInstall = await prismaClient.tyre.findMany({
            where: {
                stockTyreId: { in: stockTyreIdsInput }, // Use stockTyreId to find the Tyre
                isDeleted: false,    // Must not be soft-deleted
                isInstalled: false,  // Must not be currently installed on another unit
                isReady: true,       // Must be ready for installation
            },
            select: {
                id: true, // This is the actual Tyre.id we need
                stockTyreId: true, // Keep this to map back
                tread1: true,
                tread2: true,
                isInstalled: true,
                isDeleted: true,
                isReady: true,
                positionTyre: true,
                installedUnitId: true
            }
        });

        // Map original input stockTyreIds to found Tyre.ids for consistent processing
        const finalTyreIds: number[] = [];
        const unavailableTyreDetails: string[] = [];
        const uniqueStockTyreIds = new Set(stockTyreIdsInput);

        if (uniqueStockTyreIds.size !== stockTyreIdsInput.length) {
            unavailableTyreDetails.push('Duplicate stockTyre IDs provided in the input list.');
        }

        for (const stockTyreId of stockTyreIdsInput) {
            const foundTyre = tyresToInstall.find(t => t.stockTyreId === stockTyreId);

            if (!foundTyre) {
                // If not found, it's unavailable or doesn't exist
                const existingStockTyre = await prismaClient.stockTyre.findUnique({ // Check stockTyre status
                    where: { id: stockTyreId },
                    include: { tyre: { select: { id: true, isDeleted: true, isInstalled: true, isReady: true } } }
                });

                if (!existingStockTyre) {
                    unavailableTyreDetails.push(`StockTyre ID ${stockTyreId} not found.`);
                } else if (!existingStockTyre.tyre) {
                    unavailableTyreDetails.push(`StockTyre ID ${stockTyreId} has no associated Tyre instance.`);
                } else if (existingStockTyre.tyre.isDeleted) {
                    unavailableTyreDetails.push(`Tyre associated with StockTyre ID ${stockTyreId} is deleted.`);
                } else if (existingStockTyre.tyre.isInstalled) {
                    unavailableTyreDetails.push(`Tyre associated with StockTyre ID ${stockTyreId} is already installed.`);
                } else if (!existingStockTyre.tyre.isReady) {
                    unavailableTyreDetails.push(`Tyre associated with StockTyre ID ${stockTyreId} is not ready for installation.`);
                } else {
                    // Fallback for unexpected cases
                    unavailableTyreDetails.push(`Tyre associated with StockTyre ID ${stockTyreId} is unavailable for an unknown reason.`);
                }
            } else {
                finalTyreIds.push(foundTyre.id); // Add the actual Tyre.id to the list for installation
            }
        }

        if (finalTyreIds.length !== stockTyreIdsInput.length || unavailableTyreDetails.length > 0) {
            res.status(400).json({
                message: 'One or more tyres cannot be installed due to availability issues.',
                details: unavailableTyreDetails
            });
            return
        }


        // --- 4. Transaction for Atomic Operations ---
        const newUnitWithTyres = await prismaClient.$transaction(async (tx) => {
            // Prepare unit data, handling optional fields
            const unitData: {
                nomorUnit: string;
                hmUnit: number;
                kmUnit: number;
                siteId: number;
                unitTyreAmountId: number;
                location?: string;
            } = {
                nomorUnit,
                hmUnit: hmUnit ?? 0, // Ensures it's 0 if null or undefined
                kmUnit: kmUnit ?? 0, // Ensures it's 0 if null or undefined
                siteId,
                unitTyreAmountId
            };
            if (location) unitData.location = location;

            // 4.1. Create Unit
            const createdUnit = await tx.unit.create({
                data: unitData
            });

            // 4.2. Create UnitTyrePosition & ActivityTyre for each tyre, and update Tyre status
            for (let i = 0; i < finalTyreIds.length; i++) {
                const tyreId = finalTyreIds[i]; // Use the actual Tyre.id
                // Get the pre-fetched tyre data directly from the array
                const tyreData = tyresToInstall.find(t => t.id === tyreId);

                if (!tyreData) {
                    // This should ideally not happen due to the pre-validation, but as a safeguard
                    throw new Error(`Tyre with ID ${tyreId} became unavailable during transaction (pre-validation missed).`);
                }

                // Create UnitTyrePosition
                await tx.unitTyrePosition.create({
                    data: {
                        unitId: createdUnit.id,
                        tyreId,
                        position: i + 1 // Assign position based on array index
                    }
                });

                // Update Tyre status
                await tx.tyre.update({
                    where: { id: tyreId },
                    data: {
                        isInstalled: true,
                        isReady: false, // No longer ready if installed
                        positionTyre: i + 1, // Store current position on Tyre model
                        installedUnitId: createdUnit.id // Link Tyre to the unit it's installed on
                    }
                });

                // Create ActivityTyre for installation event
                await tx.activityTyre.create({
                    data: {
                        unitId: createdUnit.id,
                        hmAtActivity: hmUnit ?? 0, // Unit's HM at time of installation
                        kmAtActivity: kmUnit ?? 0, // Unit's KM at time of installation
                        location: location ?? null,
                        installedTyreId: tyreId,
                        tread1Install: tyreData.tread1 ?? null, // Use pre-fetched tread values
                        tread2Install: tyreData.tread2 ?? null,
                        tyrePosition: i + 1, // Position on the unit
                        dateTimeWork: new Date(), // Timestamp of the installation activity
                    }
                });
            }

            // Return the newly created unit, optionally with its newly installed tyres
            return await tx.unit.findUnique({
                where: { id: createdUnit.id },
                include: {
                    tyres: { // This is the UnitTyrePosition relation
                        include: {
                            tyre: true // Include the actual Tyre object in the response
                        }
                    }
                }
            });
        });

        res.status(201).json({ message: 'Unit created successfully', unit: newUnitWithTyres });

    } catch (error: any) {
        console.error('Error creating unit:', error);

        if (error.code === 'P2002') {
            // More specific error handling for unique constraint violations
            const target = error.meta?.target?.[0];
            if (target === 'nomorUnit') {
                res.status(409).json({ error: 'nomorUnit already exists' });
                return
            }
            // This case handles `@@unique([unitId, position])` on UnitTyrePosition
            // if a position on this new unit was somehow duplicated in the input.
            // Or if a tyreId somehow got installed twice in the same request (though pre-check helps).
            if (target === 'unitId' && error.meta?.target?.[1] === 'position') {
                res.status(409).json({ error: 'A tyre position on this unit is already assigned.' });
                return
            }
            // Fallback for other P2002 errors
            res.status(409).json({ error: `Duplicate entry for ${target || 'unknown field'}` });
            return
        }

        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

//updateUnit
export const updateUnit = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id)
        const { nomorUnit, hmUnit, siteId, location, kmUnit, dateTimeUpdate } = req.body;

        // Ambil unit lama untuk cek perubahan siteId
        const oldUnit = await unitClient.findUnique({
            where: { id: unitId },
            select: { siteId: true }
        });

        const updatedUnit = await unitClient.update({
            where: { id: unitId },
            data: {
                nomorUnit,
                hmUnit,
                kmUnit,
                siteId,
                location,
                dateTimeUpdate: new Date() // Gunakan waktu sekarang jika dateTimeUpdate tidak diberikan
            }
        });

        // Jika siteId berubah, update siteId pada semua Tyre yang terpasang di unit ini
        if (oldUnit && siteId && oldUnit.siteId !== siteId) {
            // Ambil semua Tyre yang sedang terpasang di unit ini
            const positions = await prismaClient.unitTyrePosition.findMany({
                where: { unitId },
                select: { tyreId: true }
            });
            const tyreIds = positions.map(pos => pos.tyreId).filter((id): id is number => id !== null);

            if (tyreIds.length > 0) {
                await prismaClient.tyre.updateMany({
                    where: { id: { in: tyreIds } },
                    data: { siteId }
                });
            }
        }

        res.status(200).json({ message: "Unit updated", data: updatedUnit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update unit" });
    }
};

//deleteUnit
export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id)
        if (isNaN(unitId)) {
            res.status(400).json({ message: "Invalid unit ID" });
            return;
        }
        await unitClient.delete({
            where: { id: unitId }
        });

        res.status(200).json({ message: "Unit deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete unit" });
    }
};

// Mendapatkan semua ban pada unit beserta posisi
export const getUnitTyres = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id);
        const positions = await prismaClient.unitTyrePosition.findMany({
            where: { unitId },
            orderBy: { position: 'asc' },
            include: {
                tyre: {
                    include: { stockTyre: true }
                }
            }
        });
        res.status(200).json({ data: positions });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch unit tyres" });
    }
};
