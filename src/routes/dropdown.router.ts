import { Router } from "express";
import {
    getAllDropdown,
    createDropdownItem,
    updateDropdownItem,
    deleteDropdownItem
} from "../controllers/dropdown.controller";
import { protect } from "../middlewares/auth.middleware";

const dropdownRouter = Router();

dropdownRouter.get("/", protect, getAllDropdown);
dropdownRouter.post("/:type", protect, createDropdownItem);
dropdownRouter.put("/:type/:id", protect, updateDropdownItem);
dropdownRouter.delete("/:type/:id", protect, deleteDropdownItem);


export default module.exports = dropdownRouter
