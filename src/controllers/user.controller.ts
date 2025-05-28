import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const userClient = new PrismaClient().user;

//getAllUser
export const getAllUser = async (req: Request, res: Response) => {
    try {
        const users = await userClient.findMany({
            include: { roleUser: true },
        });
        res.status(200).json({ data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get users" });
    }
}

//getUserById
export const getUserById = async (req: Request, res: Response) => {
    try {
        const UserId = Number(req.params.id);
        const user = await userClient.findFirst({
            where: { id: UserId },
            include: { roleUser: true },
        });
        // if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get user" });
    }
};

//getUserByUsername
export const getUserByUsername = async (req: Request, res: Response) => {
    try {
        const username = req.params.id;
        const user = await userClient.findFirst({
            where: { name: username },
            include: { roleUser: true },
        });
        // if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get user" });
    }
};

//CreateUser
export const createUser = async (req: Request, res: Response) => {
    const { name, password, roleId } = req.body;
    try {
        const newUser = await userClient.create({
            data: { name, password, roleId },
            include: { roleUser: true },
        });
        res.status(201).json({ message: "User created", data: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create user" });
    }
};

//updateUser
export const updateUser = async (req: Request, res: Response) => {
    const UserId = Number(req.params.id);
    const { name, password, roleId } = req.body;
    try {
        const updatedUser = await userClient.update({
            where: { id: UserId },
            data: { name, password, roleId },
            include: { roleUser: true },
        });
        res.status(200).json({ message: "User updated", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update user" });
    }
};

//deleteUser
export const deleteUser = async (req: Request, res: Response) => {
    const UserId = Number(req.params.id);
    try {
        await userClient.delete({ where: { id: UserId } });
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};