import { Router } from "express";
import {
    getAllTyre,
    getAllStockTyre,
    // getTyreById,
    // getTyreBySN,
    createTyre,
    // updateTyre,
    deleteTyre,
    updateStockTyre,
    getStockTyreById,
} from "../controllers/tyre.controller";
import { protect } from "../middlewares/auth.middleware";

const tyreRouter = Router();

tyreRouter.get("/", protect, getAllTyre)
tyreRouter.get("/stock", protect, getAllStockTyre)
tyreRouter.get("/:id", protect, getStockTyreById)
// tyreRouter.get("/sn/:sn", protect, getTyreBySN)
tyreRouter.post("/", protect, createTyre);
tyreRouter.put("/:id", protect, updateStockTyre);
tyreRouter.delete("/:id", protect, deleteTyre);

export default module.exports = tyreRouter;


