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

const tyreRouter = Router();

tyreRouter.get("/", getAllTyre)
tyreRouter.get("/stock", getAllStockTyre)
tyreRouter.get("/:id", getStockTyreById)
// tyreRouter.get("/sn/:sn", getTyreBySN)
tyreRouter.post("/", createTyre);
tyreRouter.put("/:id", updateStockTyre);
tyreRouter.delete("/:id", deleteTyre);

export default tyreRouter;


