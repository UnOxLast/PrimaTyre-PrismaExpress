import { Router } from "express";
import {
    getAllTyre,
    getAllStockTyre,
    // getTyreById,
    // getTyreBySN,
    createTyre,
    // updateTyre,
    deleteTyre,
} from "../controllers/tyre.controller";

const tyreRouter = Router();

tyreRouter.get("/", getAllTyre)
tyreRouter.get("/stock", getAllStockTyre)
// tyreRouter.get("/:id", getTyreById)
// tyreRouter.get("/sn/:sn", getTyreBySN)
tyreRouter.post("/", createTyre);
// tyreRouter.put("/:id", updateTyre);
tyreRouter.delete("/:id", deleteTyre);

export default module.exports = tyreRouter


