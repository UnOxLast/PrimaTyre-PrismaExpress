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

//createUnit
export const createUnit = async (req: Request, res: Response) => {
    try {
        const {
            nomorUnit,
            hmUnit,
            kmUnit,
            siteId,
            location,
            unitTyreAmountId,
            tyreIds
        } = req.body;

        if (!nomorUnit || !siteId || !unitTyreAmountId) {
            res.status(400).json({ message: 'nomorUnit, siteId, and unitTyreAmountId are required' });
            return;
        }

        if (!Array.isArray(tyreIds)) {
            res.status(400).json({ message: 'tyreIds must be an array' });
            return;
        }

        const tyreAmountObj = await prismaClient.unitTyreAmount.findUnique({
            where: { id: unitTyreAmountId }
        });
        if (!tyreAmountObj) {
            res.status(400).json({ message: 'unitTyreAmountId not found' });
            return;
        }
        if (tyreIds.length !== tyreAmountObj.amount) {
            res.status(400).json({ message: `tyreIds length must be ${tyreAmountObj.amount}` });
            return;
        }

        const unit = await prismaClient.$transaction(async (tx) => {
            // Siapkan data create tanpa field undefined/nullable yang tidak perlu
            const unitData: any = {
                nomorUnit,
                hmUnit: hmUnit ?? 0,
                kmUnit: kmUnit ?? 0,
                siteId,
                unitTyreAmountId
            };
            if (location) unitData.location = location;

            // 1. Buat Unit
            const newUnit = await tx.unit.create({
                data: unitData
            });

            // 2. Buat UnitTyrePosition & activityTyre untuk setiap ban
            for (let i = 0; i < tyreIds.length; i++) {
                const tyreId = tyreIds[i];
                await tx.unitTyrePosition.create({
                    data: {
                        unitId: newUnit.id,
                        tyreId,
                        position: i + 1
                    }
                });
                await tx.tyre.update({
                    where: { id: tyreId },
                    data: {
                        isInstalled: true,
                        isReady: false,
                        positionTyre: i + 1,
                        installedUnitId: newUnit.id
                    }
                });
                const tyre = await tx.tyre.findUnique({
                    where: { id: tyreId },
                    select: { tread1: true, tread2: true }
                });
                await tx.activityTyre.create({
                    data: {
                        unitId: newUnit.id,
                        hmAtActivity: hmUnit ?? 0,
                        kmAtActivity: kmUnit ?? 0,
                        location: location ?? null,
                        installedTyreId: tyreId,
                        tread1Install: tyre?.tread1 ?? null,
                        tread2Install: tyre?.tread2 ?? null,
                        tyrePosition: i + 1,
                    }
                });
            }

            return newUnit;
        });

        res.status(201).json({ message: 'Unit created successfully', unit });

    } catch (error: any) {
        console.error('Error creating unit:', error);

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'nomorUnit or tyre already assigned' });
            return;
        }

        res.status(500).json({ error: 'Internal Server Error' });
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
