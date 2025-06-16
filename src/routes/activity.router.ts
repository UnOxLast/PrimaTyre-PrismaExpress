import { Router } from "express";
import { createActivityTyre, exportActivityToExcel, getActivityByTyreId, getAllActivityTyre } from "../controllers/activity.controller";

const activityRouter = Router();

activityRouter.get("/", getAllActivityTyre)
// activityRouter.get("/tyre/:id", getActivityByTyreId)
activityRouter.get("/:id", getActivityByTyreId)
activityRouter.post("/", createActivityTyre)
// activityRouter.get("/export", exportActivityToExcel)
// activityRouter.put("/:id", updateActivity)

export default module.exports = activityRouter