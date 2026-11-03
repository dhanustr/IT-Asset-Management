
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users
// Hanya ADMIN yang dapat melihat daftar pengguna untuk dropdown aset.
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Akses ditolak. Hanya ADMIN yang dapat melihat daftar pengguna.",
      });
    }

    const users = await prisma.users.findMany({
      where: {
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      message: "Daftar pengguna berhasil diambil.",
      data: users.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departments.name,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil daftar pengguna.",
    });
  }
});

export default router;
