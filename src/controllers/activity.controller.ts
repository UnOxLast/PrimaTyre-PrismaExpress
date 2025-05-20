import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";


const activityClient = new PrismaClient().activity;

//getAllActivity
export const getAllActivity = async (req: Request, res: Response) => {
    try {
        const activities = await activityClient.findMany({
            include: {
                tyre: true,
                unit: true,
                activityType: true,
                removePurpose: true,
                removeReason: true,
                airCondition: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        res.status(200).json({ data: activities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve activities' });
    }
};

//getActivityByTyreId
export const getActivityByTyreId = async (req: Request, res: Response) => {
    const tyreId = Number(req.params.id);
    try {
        const activities = await activityClient.findMany({
            where: {
                tyreId: tyreId,
            },
            include: {
                tyre: true,
                unit: true,
                activityType: true,
                removePurpose: true,
                // RemoveReason: true,
                airCondition: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        if (!activities || activities.length === 0) {
            res.status(404).json({ message: 'No activity found for this tyreId' });
        } else {
            res.status(200).json({ data: activities });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch activities by tyreId' });
    }
};

//createActivity
export const createActivity = async (req: Request, res: Response) => {
    try {
        const {
            tyreId,
            unitId,
            activityTypeId,
            removePurposeId,
            removeReasonId,
            airConditionId,
            positionTyre,
            manpower,
            dateTimeRemove,
            dateTimeInstall,
            hmAtActivity,
            tread1SaatRemove,
            tread2SaatRemove,
            removeReason,
            tread1SaatPasang,
            tread2SaatPasang,
        } = req.body;

        const newActivity = await activityClient.create({
            data: {
                tyreId,
                unitId,
                activityTypeId,
                removePurposeId,
                removeReasonId,
                airConditionId,
                positionTyre,
                manpower,
                dateTimeRemove: dateTimeRemove ? new Date(dateTimeRemove) : null,
                dateTimeInstall: dateTimeInstall ? new Date(dateTimeInstall) : null,
                hmAtActivity,
                tread1SaatRemove,
                tread2SaatRemove,
                tread1SaatPasang,
                tread2SaatPasang,
                removeReason,
            },
        });

        res.status(201).json({ message: "Activity created successfully", data: newActivity });
    } catch (error) {
        console.error("Failed to create activity:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//updateActivity
export const updateActivity = async (req: Request, res: Response) => {
    const activityId = Number(req.params.id);
    const {
        tyreId,
        unitId,
        activityTypeId,
        removePurposeId,
        removeReasonId,
        airConditionId,
        positionTyre,
        manpower,
        dateTimeRemove,
        dateTimeInstall,
        hmAtActivity,
        tread1SaatRemove,
        tread2SaatRemove,
        removeReason,
        tread1SaatPasang,
        tread2SaatPasang,
    } = req.body;

    try {
        const updatedActivity = await activityClient.update({
            where: { id: activityId },
            data: {
                tyreId,
                unitId,
                activityTypeId,
                removePurposeId,
                removeReasonId,
                airConditionId,
                positionTyre,
                manpower,
                hmAtActivity,
                tread1SaatRemove,
                tread2SaatRemove,
                removeReason,
                dateTimeRemove,
                tread1SaatPasang,
                tread2SaatPasang,
                dateTimeInstall,
            },
            include: {
                tyre: true,
                unit: true,
                activityType: true,
                removePurpose: true,
                removeReason: true,
                airCondition: true,
            },
        });

        res.status(200).json({ message: 'Activity updated successfully', data: updatedActivity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update activity' });
    }
};

// //deleteActivity



