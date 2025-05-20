import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

export const apiKeyDbAuth = async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.headers["x-api-key"];

    if (!apiKeyHeader || typeof apiKeyHeader !== "string") {
        res.status(401).json({ message: "API Key is required" });
        return
    }

    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyHeader },
        });

        if (!apiKey || !apiKey.isActive) {
            res.status(403).json({ message: "Invalid or inactive API key" });
            return
        }

        next();
    } catch (error) {
        console.error("API key auth error:", error);
        res.status(500).json({ message: "Internal server error during API key authentication" });
    }
};