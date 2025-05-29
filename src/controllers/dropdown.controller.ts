import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tableMap: Record<string, any> = {
    airCondition: prisma.airCondition,
    removePurpose: prisma.removePurpose,
    removeReason: prisma.removeReason,
    roleUser: prisma.roleUser,
    site: prisma.site,
    tyreSize: prisma.tyreSize,
    merk: prisma.merk,
    unit: prisma.unit,
    tyre: prisma.tyre
};

// GET: Ambil semua dropdown sekaligus
export const getAllDropdown = async (req: Request, res: Response) => {
    try {
        const entries = await Promise.all(
            Object.entries(tableMap).map(async ([key, model]) => {
                // const data = await model.findMany();
                // return [key, data];
                if (key === "tyre") {
                    const data = await model.findMany({
                        where: { isDeleted: false },
                        include: {
                            stockTyre: true,
                            // tyre: {
                            //     select: {
                            //         id: true,
                            //         serialNumber: true,
                            //         isInstalled: true,
                            //         positionTyre: true,
                            //         installedUnitId: true
                            //     }
                            // }
                        }
                    });
                    return [key, data];
                } else {
                    const data = await model.findMany();
                    return [key, data];
                }
            })
        );

        const result = Object.fromEntries(entries);
        res.status(200).json(result);
    } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        res.status(500).json({ message: "Failed to fetch dropdown data" });
    }
};

// POST: Tambah satu item ke dropdown tertentu
export const createDropdownItem = async (req: Request, res: Response) => {
    const { type } = req.params;
    const data = req.body;

    const model = tableMap[type];
    if (!model) {
        res.status(400).json({ message: "Invalid dropdown type" });
        return
    }

    if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ message: "Request body is required" });
        return;
    }

    try {
        const created = await model.create({ data });
        res.status(201).json(created);
    } catch (error) {
        console.error(`Error creating ${type}:`, error);
        res.status(500).json({ message: `Failed to create ${type}` });
    }
};

// PUT: Update satu item di dropdown tertentu
export const updateDropdownItem = async (req: Request, res: Response) => {
    const { type, id } = req.params;
    const data = req.body;

    const model = tableMap[type];
    if (!model) {
        res.status(400).json({ message: "Invalid dropdown type" });
        return
    }

    try {
        const updated = await model.update({
            where: { id: isNaN(+id) ? id : +id },
            data
        });
        res.status(200).json(updated);
    } catch (error) {
        console.error(`Error updating ${type}:`, error);
        res.status(500).json({ message: `Failed to update ${type}` });
    }
};

// DELETE: Hapus item di dropdown tertentu
export const deleteDropdownItem = async (req: Request, res: Response) => {
    const { type, id } = req.params;

    const model = tableMap[type];
    if (!model) {
        res.status(400).json({ message: "Invalid dropdown type" });
        return
    }

    try {
        await model.delete({
            where: { id: isNaN(+id) ? id : +id }
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        res.status(500).json({ message: `Failed to delete ${type}` });
    }
};
