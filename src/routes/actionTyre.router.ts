import { Router } from "express";
import { getAllActionTyre, updateActionTyre } from "../controllers/actionTyre.controller";

const router = Router();

router.get("/", getAllActionTyre);
router.put("/:id", updateActionTyre);


export default router;