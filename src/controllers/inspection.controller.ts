import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";

const inspectionTyreClient = new PrismaClient().inspectionTyre;
const tyreClient = new PrismaClient().tyre
const removedPurposeClient = new PrismaClient().removePurpose

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
            isReady // ← dari frontend
        } = req.body;

        const inspection = await inspectionTyreClient.findUnique({
            where: { id: Number(inspectId) },
            include: { tyre: true }
        });

        if (!inspection) {
            res.status(404).json({ error: 'InspectionTyre not found' });
            return
        }

        // Cegah update jika ban sudah di-scrap
        if (inspection.tyre.isScrap) {
            res.status(403).json({ error: 'Tyre has been scrapped and cannot be modified' });
            return
        }

        // Validasi: jika isReady = false, removePurposeId wajib diisi
        if (isReady === false && !removePurposeId) {
            res.status(400).json({ error: 'removePurposeId is required when isReady is false' });
            return
        }

        // Update Inspection Record
        const updatedInspection = await inspectionTyreClient.update({
            where: { id: Number(inspectId) },
            data: {
                isReady,
                incidentNote: incidentNote ?? undefined,
                analysisNote: analysisNote ?? undefined,
                removePurposeId: isReady ? null : removePurposeId ?? undefined,
                dateTimeWork: dateTimeWork ? new Date(dateTimeWork) : undefined,
            }
        });

        // Logika status ban
        if (isReady) {
            // Ban siap digunakan kembali
            await tyreClient.update({
                where: { id: inspection.tyreId },
                data: {
                    isReady: true,
                    isScrap: false,
                    removedPurposeId: null,
                }
            });
        } else {
            // Ban belum siap → cek apakah SCRAP
            const purpose = await removedPurposeClient.findUnique({
                where: { id: removePurposeId }
            });

            if (!purpose) {
                res.status(400).json({ error: 'Invalid removePurposeId' });
                return
            }

            const isScrap = purpose.name.toLowerCase() === 'scrap';

            await tyreClient.update({
                where: { id: inspection.tyreId },
                data: {
                    isReady: false,
                    isScrap: isScrap
                }
            });
        }

        res.status(200).json({
            message: 'InspectionTyre updated successfully',
            result: updatedInspection
        });

    } catch (error: any) {
        console.error("Failed to update inspection:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};
