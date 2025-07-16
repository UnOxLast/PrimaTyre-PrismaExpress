import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

// Prisma clients
const tyreClient = new PrismaClient().tyre;
const stockTyreClient = new PrismaClient().stockTyre;
const unitClient = new PrismaClient().unit;
const activityClient = new PrismaClient().activityTyre;
const prismaClient = new PrismaClient();

/**
 * Ambil semua data Tyre beserta info penting.
 */
export const getAllTyre = async (req: Request, res: Response) => {
    try {
        const allTyresRaw = await tyreClient.findMany({
            where: { isDeleted: false },
            include: {
                stockTyre: true,
                site: true,
            },
        });
        res.status(200).json({ data: allTyresRaw });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch tyres" });
    }
};

/**
 * Ambil semua data StockTyre beserta relasi penting.
 */
export const getAllStockTyre = async (req: Request, res: Response) => {
    try {
        const allStockTyre = await stockTyreClient.findMany({
            where: { tyre: { isDeleted: false } },
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
        });
        res.status(200).json({ data: allStockTyre });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch stock tyres" });
    }
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
            where: { id, tyre: { isDeleted: false } },
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
            tyreSizeId,
            oHM,
            oKM,
            siteId,
            dateTimeIn
        } = req.body;

        if (!serialNumber || !merkId || !tyreSizeId || !siteId) {
            res.status(400).json({ message: 'serialNumber, merkId, tyreSizeId, and siteId are required' });
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
                    price: price ?? 0,
                    tyreSizeId,
                    oHM: oHM ?? 0,
                    oKM: oKM ?? 0,
                    dateTimeIn: dateTimeIn ? new Date(dateTimeIn) : new Date(), //
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
                    siteId,
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
        const { id } = req.params; // This 'id' is for Tyre, not StockTyre
        const {
            serialNumber,
            merkId,
            type,
            pattern,
            otd1,
            otd2,
            price,
            tyreSizeId,
            oHM, // Original HM from StockTyre when it was first recorded
            oKM, // Original KM from StockTyre when it was first recorded
            siteId, // Site where the specific Tyre is located
            dateTimeUpdate
        } = req.body;

        const tyreId = Number(id);
        if (isNaN(tyreId)) {
            res.status(400).json({ message: 'Invalid Tyre ID' });
            return
        }

        // Fetch the Tyre and its associated StockTyre directly in one query
        const tyreWithStock = await prismaClient.tyre.findUnique({
            where: { id: tyreId },
            include: {
                stockTyre: true, // Includes the related StockTyre data
                site: true, // Including the current site might be useful for the Tyre update
                installedUnit: true // Include the unit if it's currently installed, for HM/KM calculation
            }
        });

        if (!tyreWithStock) {
            res.status(404).json({ message: 'Tyre not found' });
            return
        }

        const existingStockTyre = tyreWithStock.stockTyre;

        if (!existingStockTyre) {
            // This means the Tyre exists, but its stockTyreId points to a non-existent StockTyre.
            // This indicates a data integrity problem that should be addressed.
            res.status(404).json({ message: 'Associated StockTyre not found for this Tyre. Data inconsistency detected.' });
            return;
        }

        // Check serialNumber uniqueness if changed
        // This check is against ALL StockTyres, which is correct for uniqueness.
        if (serialNumber && serialNumber !== existingStockTyre.serialNumber) {
            const duplicate = await prismaClient.stockTyre.findUnique({ where: { serialNumber } });
            if (duplicate) {
                res.status(409).json({ error: 'serialNumber already exists' });
                return;
            }
        }

        // --- Start Transaction for Atomic Update ---
        const result = await prismaClient.$transaction(async (tx) => {
            // 1. Update StockTyre
            const updatedStockTyre = await tx.stockTyre.update({
                where: { id: existingStockTyre.id },
                data: {
                    serialNumber: serialNumber ?? existingStockTyre.serialNumber,
                    merkId: merkId ?? existingStockTyre.merkId,
                    type: type ?? existingStockTyre.type,
                    pattern: pattern ?? existingStockTyre.pattern,
                    otd1: otd1 ?? existingStockTyre.otd1,
                    otd2: otd2 ?? existingStockTyre.otd2,
                    price: price ?? existingStockTyre.price,
                    tyreSizeId: tyreSizeId ?? existingStockTyre.tyreSizeId,
                    oHM: oHM ?? existingStockTyre.oHM,
                    oKM: oKM ?? existingStockTyre.oKM,
                    dateTimeUpdate: dateTimeUpdate ? new Date(dateTimeUpdate) : new Date(),
                },
            });

            // 2. Recalculate and Synchronize HM/KM for the specific Tyre linked to this StockTyre
            // Since `Tyre.stockTyreId` is `@unique`, there's only one Tyre per StockTyre.
            // We are already operating on that specific `tyreWithStock` object.

            // Fetch activities for *this specific Tyre (tyreId)*
            const activities = await tx.activityTyre.findMany({
                where: {
                    OR: [
                        { installedTyreId: tyreId },
                        { removedTyreId: tyreId }
                    ]
                },
                orderBy: { dateTimeWork: 'asc' },
                include: {
                    unit: { select: { hmUnit: true, kmUnit: true } } // Fetch current unit HM/KM, matching schema's `hmUnit`/`kmUnit`
                }
            });

            let accumulatedHM = updatedStockTyre.oHM ?? 0;
            let accumulatedKM = updatedStockTyre.oKM ?? 0;

            let lastInstallHM: number | null = null;
            let lastInstallKM: number | null = null;

            for (const activity of activities) {
                if (activity.installedTyreId === tyreId) {
                    // Tyre was installed
                    lastInstallHM = activity.hmAtActivity ?? 0;
                    lastInstallKM = activity.kmAtActivity ?? 0;
                } else if (activity.removedTyreId === tyreId && lastInstallHM !== null && lastInstallKM !== null) {
                    // Tyre was removed after being installed and we have valid install readings
                    const removalHM = activity.hmAtActivity ?? 0;
                    const removalKM = activity.kmAtActivity ?? 0;
                    accumulatedHM += Math.max(removalHM - lastInstallHM, 0);
                    accumulatedKM += Math.max(removalKM - lastInstallKM, 0);
                    lastInstallHM = null; // Reset for next installation cycle
                    lastInstallKM = null;
                }
            }

            // If the tyre is currently installed (lastInstallHM and lastInstallKM are not null)
            // and it's linked to an `installedUnitId` in the `Tyre` model,
            // fetch that unit's current HM/KM.
            if (lastInstallHM !== null && lastInstallKM !== null && tyreWithStock.installedUnitId) {
                const currentUnit = await tx.unit.findUnique({
                    where: { id: tyreWithStock.installedUnitId },
                    select: { hmUnit: true, kmUnit: true }
                });

                if (currentUnit) {
                    accumulatedHM += Math.max((currentUnit.hmUnit ?? 0) - lastInstallHM, 0);
                    accumulatedKM += Math.max((currentUnit.kmUnit ?? 0) - lastInstallKM, 0);
                }
            }


            // Update the specific Tyre (tyreWithStock.id)
            await tx.tyre.update({
                where: { id: tyreId }, // Use tyreId directly
                data: {
                    hmTyre: accumulatedHM,
                    kmTyre: accumulatedKM,
                    // Update siteId for Tyre if provided, otherwise keep existing
                    siteId: siteId ?? tyreWithStock.siteId,
                    // Also update tread if otd1/otd2 changed for stockTyre
                    // Note: If otd1/otd2 in StockTyre represent initial tread depths,
                    // and tread1/tread2 in Tyre represent *current* tread depths,
                    // then this update might not be desired unless they are always synced.
                    // If they are initial, then this should likely be removed or adjusted.
                    tread1: otd1 ?? tyreWithStock.tread1,
                    tread2: otd2 ?? tyreWithStock.tread2,
                }
            });

            return updatedStockTyre;
        }); // End of transaction

        res.status(200).json({
            message: "StockTyre and related Tyre updated successfully",
            data: result
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
export const deleteTyre = async (req: Request, res: Response) => {
    try {
        const tyreId = Number(req.params.id);
        const deletedBy = req.body.deletedBy || 'system'; // Ganti sesuai autentikasi kamu

        const existingTyre = await tyreClient.findUnique({
            where: { id: tyreId },
        });

        if (!existingTyre) {
            res.status(404).json({ error: 'Tyre not found' });
            return
        }

        if (existingTyre.isDeleted) {
            res.status(400).json({ error: 'Tyre already deleted' });
            return
        }

        const result = await tyreClient.update({
            where: { id: tyreId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy,
            },
        });

        res.status(200).json({ message: 'Tyre soft-deleted successfully', result });
    } catch (error: any) {
        console.error('Soft delete failed:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
