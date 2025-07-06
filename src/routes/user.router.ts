import { Router } from "express";
import {
    getAllUser,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";

const userRouter = Router();

userRouter.get("/", protect, getAllUser)
userRouter.get("/:id", protect, getUserById)
userRouter.get("/username/:name", protect, getUserByUsername)
userRouter.post("/", protect, createUser)
userRouter.put("/:id", protect, updateUser)
userRouter.delete("/:id", protect, deleteUser)


export default module.exports = userRouter