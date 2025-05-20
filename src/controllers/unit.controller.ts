import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const unitClient = new PrismaClient().unit;

//getAllUnit
export const getAllUnit = async (req: Request, res: Response) => {
    try {
        const units = await unitClient.findMany({
            include: {
                site: true,
                tyre: true
            }
        });

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
                site: true
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
        const { nomorUnit, hmUnit, siteId, location } = req.body;

        // if (!nomor_unit || !hm_unit || !siteId) {
        //     return res.status(400).json({ message: "nomor_unit, hm_unit, and siteId are required" });
        // }

        const newUnit = await unitClient.create({
            data: {
                nomorUnit,
                hmUnit,
                siteId,
                location
            }
        });

        res.status(201).json({ message: "Unit created", data: newUnit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create unit" });
    }
};

//updateUnit
export const updateUnit = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id)
        const { nomorUnit, hmUnit, siteId, location } = req.body;

        const updatedUnit = await unitClient.update({
            where: { id: unitId },
            data: {
                nomorUnit,
                hmUnit,
                siteId,
                location
            }
        });

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

        await unitClient.delete({
            where: { id: unitId }
        });

        res.status(200).json({ message: "Unit deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete unit" });
    }
};
