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
        const {
            nomorUnit,
            hmUnit,
            kmUnit,
            siteId,
            location,
            tyreIds // Array: [tyre1Id, tyre2Id, ... up to 6]
        } = req.body;

        if (!nomorUnit || !siteId) {
            res.status(400).json({ message: 'nomorUnit and siteId are required' });
            return
        }

        // Validasi: tidak boleh kosong atau null
        if (!tyreIds || !Array.isArray(tyreIds) || tyreIds.length === 0) {
            res.status(400).json({
                message: 'tyreIds is required and cannot be empty'
            })
            return
        }

        if (tyreIds && tyreIds.length > 6) {
            res.status(400).json({ message: 'You can only assign up to 6 tyres' });
            return
        }


        const unit = await prismaClient.$transaction(async (tx) => {
            // 1. Buat Unit
            const newUnit = await tx.unit.create({
                data: {
                    nomorUnit,
                    hmUnit,
                    kmUnit,
                    siteId,
                    location,
                    tyre1Id: tyreIds?.[0] ?? null,
                    tyre2Id: tyreIds?.[1] ?? null,
                    tyre3Id: tyreIds?.[2] ?? null,
                    tyre4Id: tyreIds?.[3] ?? null,
                    tyre5Id: tyreIds?.[4] ?? null,
                    tyre6Id: tyreIds?.[5] ?? null
                }
            });

            // 2. Update Tyre jika ada
            if (tyreIds && tyreIds.length > 0) {
                for (let i = 0; i < tyreIds.length; i++) {
                    await tx.tyre.update({
                        where: { id: tyreIds[i] },
                        data: {
                            isInstalled: true,
                            isReady: false,
                            installedUnitId: newUnit.id,
                            positionTyre: i + 1
                        }
                    });
                }
            }

            for (let i = 0; i < tyreIds.length; i++) {
                const tyreId = tyreIds[i];
                if (!tyreId) continue;

                // Update Tyre
                const currentTyre = await tx.tyre.findUnique({
                    where: { id: tyreId },
                    select: {
                        tread1: true,
                        tread2: true
                    }
                });

                await tx.activityTyre.create({
                    data: {
                        location: newUnit.location,
                        unitId: newUnit.id,
                        tyrePosition: i + 1,
                        installedTyreId: tyreId,
                        hmAtActivity: hmUnit ?? 0,
                        kmAtActivity: kmUnit ?? 0,
                        tread1Install: currentTyre?.tread1 ?? 0,
                        tread2Install: currentTyre?.tread2 ?? 0,
                        // Kosongkan tanggal, nanti diisi saat update aktivitas lanjutan
                        dateTimeWork: null,
                        dateTimeDone: null
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
            return
        }

        res.status(500).json({ error: 'Internal Server Error' });
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
