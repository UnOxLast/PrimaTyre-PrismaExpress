import { Router } from "express";
import { exportActivityToExcel } from "../controllers/activity.controller";
import { protect } from "../middlewares/auth.middleware";

const exportRouter = Router();

exportRouter.post("/", protect, exportActivityToExcel);


export default module.exports = exportRouter;
