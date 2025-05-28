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
<<<<<<< HEAD
tyreRouter.get("/:id", getStockTyreById)
// tyreRouter.get("/sn/:sn", getTyreBySN)
tyreRouter.post("/", createTyre);
tyreRouter.put("/:id", updateStockTyre);
=======
// tyreRouter.get("/:id", getTyreById)
// tyreRouter.get("/sn/:sn", getTyreBySN)
tyreRouter.post("/", createTyre);
// tyreRouter.put("/:id", updateTyre);
>>>>>>> 6e1ad0512ef4888c5cb0209383ff2c01da294f2a
tyreRouter.delete("/:id", deleteTyre);

export default tyreRouter;


