import { Router } from "express";
import { exportActivityToExcel } from "../controllers/activity.controller";

const exportRouter = Router();

exportRouter.post("/", exportActivityToExcel);


export default module.exports = exportRouter;
