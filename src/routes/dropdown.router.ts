import { Router } from "express";
import {
    getAllDropdown,
    createDropdownItem,
    updateDropdownItem,
    deleteDropdownItem
} from "../controllers/dropdown.controller";

const dropdownRouter = Router();

dropdownRouter.get("/", getAllDropdown);
dropdownRouter.post("/:type", createDropdownItem);
dropdownRouter.put("/:type/:id", updateDropdownItem);
dropdownRouter.delete("/:type/:id", deleteDropdownItem);


export default module.exports = dropdownRouter
