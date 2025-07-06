import { JwtPayload } from "jsonwebtoken";
import { User } from "@prisma/client";

// Extend Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload | User;
        }
    }
}
