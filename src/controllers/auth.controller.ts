import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { Prisma, PrismaClient } from "@prisma/client"; // import Prisma client instance

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    const { name, password } = req.body;

    if (!name || !password) {
        res.status(400).json({ message: "Name and password are required." });
        return
    }

    const user = await prisma.user.findUnique({
        where: { name },
        include: { roleUser: true },
    });

    if (!user) {
        res.status(401).json({ message: "User not found" });
        return
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(401).json({ message: "Invalid password" });
        return
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ message: "JWT secret is not configured" });
        return;
    }

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            role: user.roleUser.name,
        },
        jwtSecret,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        } as jwt.SignOptions // casting agar TypeScript tidak error
    );


    res.json({ token });
};
