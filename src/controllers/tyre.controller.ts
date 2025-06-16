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
            oKM,
            siteId,
            dateTimeUpdate
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
                dateTimeUpdate: new Date(dateTimeUpdate) ?? new Date(),
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
                    siteId: siteId, // Gunakan siteId dari StockTyre jika tidak diubah
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
