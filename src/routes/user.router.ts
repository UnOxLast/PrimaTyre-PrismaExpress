import { Router } from "express";
import {
    getAllUser,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.get("/", getAllUser)
userRouter.get("/:id", getUserById)
userRouter.get("/username/:name", getUserByUsername)
userRouter.post("/", createUser)
userRouter.put("/:id", updateUser)
userRouter.delete("/:id", deleteUser)


export default module.exports = userRouter