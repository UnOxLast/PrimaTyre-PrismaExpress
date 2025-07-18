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
 * Membuat Unit baru dan mengaitkan ban-ban yang ditentukan (menggunakan Tyre.id langsung).
 * - Validasi input dasar.
 * - Validasi jumlah ban sesuai dengan unitTyreAmount.
 * - Memvalidasi setiap ban yang akan dipasang: harus ada, tidak terhapus, dan tidak sedang terpasang di unit lain.
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
            tyreIds, // Ini sekarang adalah array Tyre.id langsung
            dateTimeDone, // dateTimeDone dari request body (string)
        } = req.body;

        // --- 1. Basic Input Validation ---
        if (!nomorUnit || !siteId || !unitTyreAmountId) {
            res.status(400).json({ message: 'nomorUnit, siteId, and unitTyreAmountId are required' });
            return;
        }

        if (!Array.isArray(tyreIds)) {
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

        if (tyreIds.length !== tyreAmountObj.amount) {
            res.status(400).json({ message: `Exactly ${tyreAmountObj.amount} tyre(s) must be provided for this unit type.` });
            return;
        }

        // --- 3. Pre-validate each Tyre (CRITICAL) ---
        // Find the Tyre record for each provided Tyre.id, and include its status
        const tyresToInstall = await prismaClient.tyre.findMany({
            where: {
                id: { in: tyreIds }, // Langsung gunakan Tyre.id
                isDeleted: false,    // Must not be soft-deleted
                isInstalled: false,  // Must not be currently installed on another unit
                isReady: true,       // Must be ready for installation
            },
            select: {
                id: true, // This is the actual Tyre.id we need
                stockTyreId: true, // Keep this for potential future needs
                tread1: true,
                tread2: true,
                isInstalled: true,
                isDeleted: true,
                isReady: true,
                positionTyre: true,
                installedUnitId: true
            }
        });

        // Map original input Tyre.ids to found Tyre.ids for consistent processing
        const finalTyreIds: number[] = [];
        const unavailableTyreDetails: string[] = [];
        const uniqueTyreIdsInput = new Set(tyreIds); // Check for duplicates in input array itself

        if (uniqueTyreIdsInput.size !== tyreIds.length) {
            unavailableTyreDetails.push('Duplicate Tyre IDs provided in the input list.');
        }

        for (const tyreId of tyreIds) {
            const foundTyre = tyresToInstall.find(t => t.id === tyreId);

            if (!foundTyre) {
                // If not found, it's unavailable or doesn't exist
                const existingTyreCheck = await prismaClient.tyre.findUnique({ // Check actual Tyre status for specific error message
                    where: { id: tyreId },
                    select: { id: true, isDeleted: true, isInstalled: true, isReady: true }
                });

                if (!existingTyreCheck) {
                    unavailableTyreDetails.push(`Tyre ID ${tyreId} not found.`);
                } else if (existingTyreCheck.isDeleted) {
                    unavailableTyreDetails.push(`Tyre ID ${tyreId} is deleted.`);
                } else if (existingTyreCheck.isInstalled) {
                    unavailableTyreDetails.push(`Tyre ID ${tyreId} is already installed.`);
                } else if (!existingTyreCheck.isReady) {
                    unavailableTyreDetails.push(`Tyre ID ${tyreId} is not ready for installation.`);
                } else {
                    // Fallback for unexpected cases (should be caught by prismaClient.tyre.findMany above)
                    unavailableTyreDetails.push(`Tyre ID ${tyreId} is unavailable for an unknown reason.`);
                }
            } else {
                finalTyreIds.push(foundTyre.id); // Add the actual Tyre.id to the list for installation
            }
        }

        if (finalTyreIds.length !== tyreIds.length || unavailableTyreDetails.length > 0) {
            res.status(400).json({
                message: 'One or more tyres cannot be installed due to availability issues.',
                details: unavailableTyreDetails
            });
            return;
        }

        // --- Parse dateTimeDone from string to Date object ---
        let parsedDateTimeDone: Date | undefined;
        if (dateTimeDone) {
            try {
                parsedDateTimeDone = new Date(dateTimeDone);
                // Check if the parsed date is valid (e.g., not "Invalid Date")
                if (isNaN(parsedDateTimeDone.getTime())) {
                    res.status(400).json({ message: 'Invalid dateTimeDone format. Please provide a valid date string (e.g., YYYY-MM-DDTHH:mm:ssZ).' });
                    return;
                }
            } catch (e) {
                // Catch any errors during date parsing
                res.status(400).json({ message: 'Error parsing dateTimeDone. Please provide a valid date string.' });
                return;
            }
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

            // dateTimeWork should represent the actual moment of installation for the activity
            const activityDateTimeWork = new Date(); // Current server time for the work activity

            // 4.2. Create UnitTyrePosition & ActivityTyre for each tyre, and update Tyre status
            for (let i = 0; i < finalTyreIds.length; i++) {
                const tyreId = finalTyreIds[i]; // Use the actual Tyre.id
                // Get the pre-fetched tyre data directly from the array
                const tyreData = tyresToInstall.find(t => t.id === tyreId);

                if (!tyreData) {
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
                        dateTimeWork: activityDateTimeWork, // Use the server-generated work time
                        // Conditionally add dateTimeDone only if it was provided and successfully parsed
                        ...(parsedDateTimeDone && { dateTimeDone: parsedDateTimeDone }),
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
        return;

    } catch (error: any) {
        console.error('Error creating unit:', error);

        if (error.code === 'P2002') {
            // More specific error handling for unique constraint violations
            const target = error.meta?.target?.[0];
            if (target === 'nomorUnit') {
                res.status(409).json({ error: 'nomorUnit already exists' });
                return;
            }
            // This case handles `@@unique([unitId, position])` on UnitTyrePosition
            // if a position on this new unit was somehow duplicated in the input.
            // Or if a tyreId somehow got installed twice in the same request (though pre-check helps).
            if (target === 'unitId' && error.meta?.target?.[1] === 'position') {
                res.status(409).json({ error: 'A tyre position on this unit is already assigned.' });
                return;
            }
            // Fallback for other P2002 errors
            res.status(409).json({ error: `Duplicate entry for ${target || 'unknown field'}` });
            return;
        }

        res.status(500).json({ error: 'Internal Server Error', message: error.message });
        return;
    }
};

/**
 * Memperbarui data Unit yang ada.
 * - Validasi ID unit.
 * - Memperbarui bidang unit yang disediakan.
 * - Jika siteId unit berubah, sinkronkan siteId pada semua ban yang saat ini terpasang di unit tersebut.
 * - Menggunakan transaksi untuk atomisitas.
 * - dateTimeUpdate selalu disetel ke waktu server saat ini.
 */
export const updateUnit = async (req: Request, res: Response) => {
    try {
        const unitId = Number(req.params.id);
        // Validate unitId format immediately
        if (isNaN(unitId)) {
            res.status(400).json({ message: 'Invalid Unit ID format.' });
            return;
        }

        const {
            nomorUnit,
            hmUnit,
            siteId,
            location,
            kmUnit,
            // Removed dateTimeUpdate from destructuring req.body
        } = req.body;

        // --- Input Validation for Request Body Fields ---
        // Check if field is provided AND its type is correct.
        if (nomorUnit !== undefined && typeof nomorUnit !== 'string') {
            res.status(400).json({ message: 'nomorUnit must be a string if provided.' });
            return;
        }
        if (hmUnit !== undefined && typeof hmUnit !== 'number') {
            res.status(400).json({ message: 'hmUnit must be a number if provided.' });
            return;
        }
        // kmUnit can be null in the request body, but must be a number if not null
        if (kmUnit !== undefined && typeof kmUnit !== 'number' && kmUnit !== null) {
            res.status(400).json({ message: 'kmUnit must be a number or null if provided.' });
            return;
        }
        if (siteId !== undefined && typeof siteId !== 'number') {
            res.status(400).json({ message: 'siteId must be a number if provided.' });
            return;
        }
        // location can be null in the request body, but must be a string if not null
        if (location !== undefined && typeof location !== 'string' && location !== null) {
            res.status(400).json({ message: 'location must be a string or null if provided.' });
            return;
        }
        // Removed validation for dateTimeUpdate as it's no longer expected from body

        // --- Start Transaction for Atomic Update ---
        const result = await prismaClient.$transaction(async (tx) => {
            // Fetch the existing unit within the transaction for consistent state.
            const existingUnit = await tx.unit.findUnique({
                where: { id: unitId },
                select: { id: true, siteId: true } // Only select what's needed for the update logic
            });

            // If the unit doesn't exist, throw an error to be caught by the outer catch block.
            if (!existingUnit) {
                throw new Error('Unit not found'); // Custom error message to distinguish from other 500s
            }

            // Prepare update data: only include fields that are explicitly provided in the request body.
            const updateData: {
                nomorUnit?: string;
                hmUnit?: number;
                kmUnit?: number;
                siteId?: number;
                location?: string | null;
                dateTimeUpdate: Date; // This field will always be updated to current server time
            } = {
                dateTimeUpdate: new Date(), // Always set to the current server timestamp
            };

            if (nomorUnit !== undefined) updateData.nomorUnit = nomorUnit;
            if (hmUnit !== undefined) updateData.hmUnit = hmUnit;
            if (kmUnit !== undefined) updateData.kmUnit = kmUnit ?? 0; // Convert null to 0 for Int field as per schema
            if (siteId !== undefined) updateData.siteId = siteId;
            if (location !== undefined) updateData.location = location ?? null; // Explicitly set to null if provided as null

            // 1. Update the Unit record
            const updatedUnit = await tx.unit.update({
                where: { id: unitId },
                data: updateData,
            });

            // 2. If siteId has changed, update the siteId for all Tyres currently installed on this unit.
            if (siteId !== undefined && existingUnit.siteId !== siteId) {
                const positions = await tx.unitTyrePosition.findMany({
                    where: { unitId: updatedUnit.id },
                    select: { tyreId: true }
                });
                const tyreIdsToUpdate = positions
                    .map(pos => pos.tyreId)
                    .filter((id): id is number => id !== null);

                if (tyreIdsToUpdate.length > 0) {
                    await tx.tyre.updateMany({
                        where: { id: { in: tyreIdsToUpdate } },
                        data: { siteId }
                    });
                }
            }

            return updatedUnit; // Return the successfully updated unit data from the transaction
        }); // End of prismaClient.$transaction

        // Send a success response with the updated unit data
        res.status(200).json({ message: "Unit updated successfully", data: result });
        return; // Explicitly return after sending response

    } catch (error: any) {
        console.error('Error updating unit:', error); // Log the full error for debugging

        // --- Specific Error Handling ---
        if (error.code === 'P2002') {
            const target = error.meta?.target?.[0];
            if (target === 'nomorUnit') {
                res.status(409).json({ error: 'Unit number already exists. Please choose a different one.' });
                return;
            }
            res.status(409).json({ error: `Duplicate entry found for ${target || 'unknown field'}.` });
            return;
        }
        if (error.code === 'P2025' || error.message === 'Unit not found') {
            res.status(404).json({ message: 'Unit not found.' });
            return;
        }
        // Fallback for any other unexpected errors
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
        return;
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
