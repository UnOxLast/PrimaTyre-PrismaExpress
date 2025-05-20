import { Router } from "express";
import {
    createActivity,
    getActivityByTyreId,
    getAllActivity,
    updateActivity
} from "../controllers/activity.controller";

const activityRouter = Router();

activityRouter.get("/", getAllActivity)
activityRouter.get("/tyre/:id", getActivityByTyreId)
activityRouter.post("/", createActivity)
activityRouter.put("/:id", updateActivity)

export default module.exports = activityRouter