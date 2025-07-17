import { Router } from "express";
import { createActivityTyre, exportActivityToExcel, getActivityByTyreId, getAllActivityTyre } from "../controllers/activity.controller";
import { protect } from "../middlewares/auth.middleware";

const activityRouter = Router();

activityRouter.get("/", protect, getAllActivityTyre)
// activityRouter.get("/tyre/:id", protect, getActivityByTyreId)
activityRouter.get("/:id", protect, getActivityByTyreId)
activityRouter.post("/", protect, createActivityTyre)
activityRouter.get("/export", protect, exportActivityToExcel)
// activityRouter.put("/:id", protect, updateActivity)

export default module.exports = activityRouter