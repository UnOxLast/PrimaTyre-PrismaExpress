import { Router } from "express";
import { getAllInspectionTyre, updateInspectionTyre } from "../controllers/inspection.controller";
import { protect } from "../middlewares/auth.middleware";

const inspectionRouter = Router();

inspectionRouter.get("/", protect, getAllInspectionTyre);
// inspectionRouter.post("/:type", createDropdownItem);
inspectionRouter.put("/:id", protect, updateInspectionTyre);
// inspectionRouter.delete("/:type/:id", deleteDropdownItem);


export default module.exports = inspectionRouter