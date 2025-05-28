import { Router } from "express";
import { createActivityTyre, getActivityByTyreId, getAllActivityTyre } from "../controllers/activity.controller";

const activityRouter = Router();

activityRouter.get("/", getAllActivityTyre)
// activityRouter.get("/tyre/:id", getActivityByTyreId)
activityRouter.get("/:id", getActivityByTyreId)
activityRouter.post("/", createActivityTyre)
// activityRouter.put("/:id", updateActivity)

export default module.exports = activityRouter