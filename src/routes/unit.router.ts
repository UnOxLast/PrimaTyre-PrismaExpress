import { Router } from "express";
import {
    getAllUnit,
    getUnitById,
    getUnitBySN,
    createUnit,
    updateUnit,
    deleteUnit
} from "../controllers/unit.controller";
import { protect } from "../middlewares/auth.middleware";

const unitRouter = Router();

unitRouter.get("/", protect, getAllUnit)
unitRouter.get("/:id", protect, getUnitById);
unitRouter.get("/sn/:sn", protect, getUnitBySN);
unitRouter.post("/", protect, createUnit);
unitRouter.put("/:id", protect, updateUnit);
unitRouter.delete("/:id", protect, deleteUnit);

export default module.exports = unitRouter