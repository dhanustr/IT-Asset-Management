import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Format header: Bearer <token>
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token autentikasi tidak ditemukan.",
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum dikonfigurasi.");

      return res.status(500).json({
        message: "Konfigurasi autentikasi belum tersedia.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded !== "object" ||
      typeof decoded.sub !== "string" ||
      !/^\d+$/.test(decoded.sub)
    ) {
      return res.status(401).json({
        message: "Token tidak valid.",
      });
    }

    const userId = BigInt(decoded.sub);

    // Ambil role terbaru dari database, bukan hanya dari token.
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department_id: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Akun tidak ditemukan.",
      });
    }

    req.user = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id.toString(),
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message:
          error.name === "TokenExpiredError"
            ? "Token sudah kedaluwarsa. Silakan login kembali."
            : "Token tidak valid.",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
}