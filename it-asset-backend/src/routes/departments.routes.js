
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const departments = await prisma.departments.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: departments.map((department) => ({
        id: String(department.id),
        name: department.name,
      })),
    });
  } catch (error) {
    console.error("Gagal mengambil departemen:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar departemen",
    });
  }
});

export default router;
