import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";

const inspectionTyreClient = new PrismaClient().inspectionTyre;
const tyreClient = new PrismaClient().tyre
const removedPurposeClient = new PrismaClient().removePurpose
const actionTyreClient = new PrismaClient().actionTyre;
const prismaClient = new PrismaClient();

export const getAllInspectionTyre = async (req: Request, res: Response) => {
    try {
        const inspections = await inspectionTyreClient.findMany({
            orderBy: { dateTimeIn: 'desc' },
            include: {
                tyre: {
                    include: {
                        stockTyre: true, // Jika ingin info serialNumber dsb.
                    },
                },
                activityTyre: {
                    include: {
                        unit: true, // jika perlu info unit
                    },
                },
                removePurpose: true, // RemovePurpose sebagai status
            },
        });

        res.status(200).json({ data: inspections });
    } catch (error: any) {
        console.error("Failed to fetch inspection data:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};

export const updateInspectionTyre = async (req: Request, res: Response) => {
    try {
        const inspectId = Number(req.params.id)
        const {
            incidentNote,
            analysisNote,
            removePurposeId,
            dateTimeWork,
            isReady
        } = req.body;

        await prismaClient.$transaction(async (tx) => {
            const inspection = await tx.inspectionTyre.findUnique({
                where: { id: inspectId },
                include: { tyre: true }
            });

            if (!inspection) {
                throw res.status(404).json({ error: 'InspectionTyre not found' });

            }

            if (inspection.tyre.isScrap) {
                throw res.status(403).json({ error: 'Tyre has been scrapped and cannot be modified' });
            }

            if (isReady === false && !removePurposeId) {
                throw res.status(400).json({ error: 'removePurposeId is required when isReady is false' });
            }

            const updatedInspection = await tx.inspectionTyre.update({
                where: { id: inspectId },
                data: {
                    isDone: true,
                    incidentNote: incidentNote ?? undefined,
                    analysisNote: analysisNote ?? undefined,
                    removePurposeId: isReady ? null : removePurposeId ?? undefined,
                    dateTimeWork: dateTimeWork ? new Date(dateTimeWork) : undefined,
                }
            });

            if (isReady) {
                await tx.tyre.update({
                    where: { id: inspection.tyreId },
                    data: {
                        isReady: true,
                        isScrap: false,
                        removedPurposeId: null,
                    }
                });
            } else {
                const purpose = await tx.removePurpose.findUnique({
                    where: { id: removePurposeId }
                });

                if (!purpose) {
                    res.status(400).json({ error: 'Invalid removePurposeId' });
                    return;
                }

                const isScrap = purpose.name.toLowerCase() === 'scrap';

                await tx.tyre.update({
                    where: { id: inspection.tyreId },
                    data: {
                        isReady: false,
                        isScrap: false, // Tetap false karena belum ada aksi
                        removedPurposeId: removePurposeId
                    }
                });

                // Tambahkan ActionTyre jika belum pernah dibuat
                const existingAction = await tx.actionTyre.findFirst({
                    where: {
                        inspections: {
                            some: {
                                id: inspectId
                            }
                        }
                    }
                });

                if (!existingAction) {
                    await tx.actionTyre.create({
                        data: {
                            tyreId: inspection.tyreId,
                            removePurposeId: removePurposeId,
                            dateTimeIn: dateTimeWork ? new Date(dateTimeWork) : undefined,
                            inspections: {
                                connect: { id: inspectId }
                            }
                        }
                    });
                }
            }

            res.status(200).json({
                message: 'InspectionTyre updated successfully',
                result: updatedInspection
            });
        });
    } catch (error: any) {
        console.error("Failed to update inspection:", error);
        const status = error?.status || 500;
        const message = error?.error || error?.message || 'Internal server error';
        res.status(status).json({ error: message });
    }
};
