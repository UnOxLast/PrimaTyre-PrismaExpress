import { Router } from "express";
import {
    getAllUnit,
    getUnitById,
    getUnitBySN,
    createUnit,
    updateUnit,
    deleteUnit
} from "../controllers/unit.controller";

const unitRouter = Router();

unitRouter.get("/", getAllUnit)
unitRouter.get("/:id", getUnitById);
unitRouter.get("/sn/:sn", getUnitBySN)
unitRouter.post("/", createUnit);
unitRouter.put("/:id", updateUnit);
unitRouter.delete("/:id", deleteUnit);

export default module.exports = unitRouter