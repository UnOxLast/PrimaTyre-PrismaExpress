import { Router } from "express";
import { getAllInspectionTyre, updateInspectionTyre } from "../controllers/inspection.controller";

const inspectionRouter = Router();

inspectionRouter.get("/", getAllInspectionTyre);
// inspectionRouter.post("/:type", createDropdownItem);
inspectionRouter.put("/:id", updateInspectionTyre);
// inspectionRouter.delete("/:type/:id", deleteDropdownItem);


export default module.exports = inspectionRouter