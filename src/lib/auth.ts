import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export function generateToken(operatorId: string): string {
    return jwt.sign({ operatorId }, process.env.JWT_SECRET!, {
        expiresIn: "24h",
    });
}

export function verifyToken(token: string): { operatorId: string } | null {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!) as {
            operatorId: string;
        };
    } catch {
        return null;
    }
}

export async function authenticateOperator(username: string, password: string) {
    const operator = await prisma.operator.findUnique({
        where: { username },
    });

    if (!operator) {
        return null;
    }

    const isValid = await verifyPassword(password, operator.password);
    if (!isValid) {
        return null;
    }

    return operator;
}
