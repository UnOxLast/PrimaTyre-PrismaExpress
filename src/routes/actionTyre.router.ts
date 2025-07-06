import { Router } from "express";
import { getAllActionTyre, updateActionTyre } from "../controllers/actionTyre.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getAllActionTyre);
router.put("/:id", protect, updateActionTyre);

export default module.exports = router;