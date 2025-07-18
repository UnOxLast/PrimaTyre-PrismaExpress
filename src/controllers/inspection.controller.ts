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

/**
* Updates an existing InspectionTyre record.
* - Validates inspection ID.
* - Prevents modification of scrapped tyres.
* - Ensures removePurposeId is provided when isReady is set to false.
* - Updates related tyre status (isReady, isScrap, removedPurposeId).
* - Creates or updates an ActionTyre if necessary.
* - Uses a transaction for atomicity.
*/
export const updateInspectionTyre = async (req: Request, res: Response) => {
    try {
        const inspectId = Number(req.params.id);
        if (isNaN(inspectId)) {
            res.status(400).json({ message: 'Invalid Inspection ID format.' });
            return;
        }

        const {
            incidentNote,
            analysisNote,
            removePurposeId, // Can be number or null/undefined from body
            dateTimeWork,    // Can be string or null/undefined from body
            isReady          // Boolean from body
        } = req.body;

        // --- Input Validation ---
        if (isReady !== undefined && typeof isReady !== 'boolean') {
            res.status(400).json({ message: 'isReady must be a boolean if provided.' });
            return;
        }
        if (incidentNote !== undefined && typeof incidentNote !== 'string' && incidentNote !== null) {
            res.status(400).json({ message: 'incidentNote must be a string or null if provided.' });
            return;
        }
        if (analysisNote !== undefined && typeof analysisNote !== 'string' && analysisNote !== null) {
            res.status(400).json({ message: 'analysisNote must be a string or null if provided.' });
            return;
        }
        // Validate removePurposeId if provided AND is not null
        if (removePurposeId !== undefined && removePurposeId !== null && typeof removePurposeId !== 'number') {
            res.status(400).json({ message: 'removePurposeId must be a number or null if provided.' });
            return;
        }
        if (dateTimeWork !== undefined && typeof dateTimeWork !== 'string' && dateTimeWork !== null) {
            res.status(400).json({ message: 'dateTimeWork must be a date string or null if provided.' });
            return;
        }

        // Parse dateTimeWork to Date object
        let parsedDateTimeWork: Date | undefined;
        if (dateTimeWork) {
            try {
                parsedDateTimeWork = new Date(dateTimeWork);
                if (isNaN(parsedDateTimeWork.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeWork format. Please provide a valid date string.' });
                    return;
                }
            } catch (e) {
                res.status(400).json({ message: 'Error parsing dateTimeWork. Please provide a valid date string.' });
                return;
            }
        }

        // --- Transaction for Atomic Operations ---
        const result = await prismaClient.$transaction(async (tx) => {
            const inspection = await tx.inspectionTyre.findUnique({
                where: { id: inspectId },
                include: { tyre: true } // Include tyre to check isScrap and update it
            });

            if (!inspection) {
                throw new Error('InspectionTyre not found');
            }

            if (inspection.tyre.isScrap) {
                throw new Error('Tyre has been scrapped and cannot be modified');
            }

            // --- Determine final removePurposeId and validate it if necessary ---
            let finalRemovePurposeIdForDb: number | null = null; // What goes into the DB (null means not set)
            let purposeData: { id: number; name: string } | null = null;

            if (isReady === false) { // If tyre is NOT ready (implies removal/action and requires purpose)
                if (removePurposeId === undefined || removePurposeId === null) {
                    throw new Error('removePurposeId is required when isReady is false');
                }
                // Validate if the provided removePurposeId actually exists
                // This call is now safe because removePurposeId is guaranteed to be a number.
                purposeData = await tx.removePurpose.findUnique({
                    where: { id: removePurposeId }
                });
                if (!purposeData) {
                    throw new Error(`Invalid removePurposeId: ${removePurposeId} not found.`);
                }
                finalRemovePurposeIdForDb = removePurposeId; // Use the provided valid ID
            } else if (isReady === true) { // If tyre IS ready (implies no removal purpose)
                finalRemovePurposeIdForDb = null; // Explicitly nullify for DB
                // If client sends removePurposeId with isReady: true, decide if it's an error.
                // Current logic: we'll ignore it and nullify.
            } else if (removePurposeId !== undefined && removePurposeId !== null) {
                // If isReady is not provided, but removePurposeId is, validate it
                purposeData = await tx.removePurpose.findUnique({
                    where: { id: removePurposeId }
                });
                if (!purposeData) {
                    throw new Error(`Invalid removePurposeId: ${removePurposeId} not found.`);
                }
                finalRemovePurposeIdForDb = removePurposeId;
            }


            // --- Update InspectionTyre ---
            const updateInspectionData: any = {
                isDone: true, // Assuming inspection is done after update
                incidentNote: incidentNote ?? undefined, // Use undefined to skip update if not provided
                analysisNote: analysisNote ?? undefined,
                removePurposeId: finalRemovePurposeIdForDb, // Use the determined final ID for DB
                dateTimeWork: parsedDateTimeWork ?? undefined, // Use parsed Date or undefined
            };

            const updatedInspection = await tx.inspectionTyre.update({
                where: { id: inspectId },
                data: updateInspectionData
            });

            // --- Update Tyre Status based on isReady ---
            // The isReady check now determines the Tyre's state after inspection
            if (isReady === true) {
                await tx.tyre.update({
                    where: { id: inspection.tyreId },
                    data: {
                        isReady: true,
                        isScrap: false, // Ensure not scrap if ready
                        isInstalled: inspection.tyre.isInstalled, // Keep current installed status
                        removedPurposeId: null, // No removal purpose if it's ready for use
                        positionTyre: inspection.tyre.positionTyre, // Keep current position
                        installedUnitId: inspection.tyre.installedUnitId // Keep current installed unit
                    }
                });
            } else if (isReady === false) { // Tyre is NOT ready (implies it needs action/is scrap/etc.)
                await tx.tyre.update({
                    where: { id: inspection.tyreId },
                    data: {
                        isReady: false,
                        isScrap: false, // Assuming isScrap is handled by a specific action, not just isReady:false
                        isInstalled: inspection.tyre.isInstalled, // Keep current installed status
                        removedPurposeId: finalRemovePurposeIdForDb, // Set the purpose for why it's not ready
                        positionTyre: inspection.tyre.positionTyre, // Keep current position
                        installedUnitId: inspection.tyre.installedUnitId // Keep current installed unit
                    }
                });

                // --- Create or Update ActionTyre ---
                // Add/connect to ActionTyre only if removePurposeId is valid (i.e., purposeData exists)
                if (finalRemovePurposeIdForDb !== null && purposeData) {
                    const existingAction = await tx.actionTyre.findFirst({
                        where: {
                            tyreId: inspection.tyreId, // Action is for this specific tyre
                            isDone: false, // Look for an ongoing action
                        },
                    });

                    if (!existingAction) {
                        // Create a new ActionTyre if one doesn't exist for this tyre
                        await tx.actionTyre.create({
                            data: {
                                tyreId: inspection.tyreId,
                                removePurposeId: finalRemovePurposeIdForDb,
                                dateTimeIn: parsedDateTimeWork ?? undefined, // Use parsed date for dateTimeIn
                                inspections: {
                                    connect: { id: inspectId }
                                }
                            }
                        });
                    } else {
                        // If an action already exists, you might want to connect this inspection to it
                        // Or update its removePurposeId if it changed.
                        // For now, let's just connect the inspection if the action exists
                        await tx.actionTyre.update({
                            where: { id: existingAction.id },
                            data: {
                                inspections: {
                                    connect: { id: inspectId }
                                },
                                // Maybe update removePurposeId if it changed?
                                removePurposeId: finalRemovePurposeIdForDb // Update purpose if new one provided
                            }
                        });
                    }
                }
            }

            return updatedInspection; // Return the result of the transaction
        }); // End of prismaClient.$transaction

        res.status(200).json({
            message: 'InspectionTyre updated successfully',
            result: result // Use 'result' from the transaction
        });
        return;

    } catch (error: any) {
        console.error("Failed to update inspection:", error);

        // --- Centralized Error Handling ---
        if (error.message === 'InspectionTyre not found') {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error.message === 'Tyre has been scrapped and cannot be modified') {
            res.status(403).json({ error: error.message });
            return;
        }
        if (error.message.includes('removePurposeId is required') || error.message.includes('Invalid removePurposeId')) {
            res.status(400).json({ error: error.message });
            return;
        }

        // Handle specific Prisma errors
        if (error.code === 'P2002') { // Unique constraint violation
            res.status(409).json({ error: `Duplicate entry: ${error.meta?.target}` });
            return;
        }
        if (error.code === 'P2025') { // Record not found for update/delete (e.g., if inspectId not found in update)
            res.status(404).json({ message: 'Record not found for update.', error: error.message });
            return;
        }
        // Fallback for any other unexpected errors
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
    }
};
