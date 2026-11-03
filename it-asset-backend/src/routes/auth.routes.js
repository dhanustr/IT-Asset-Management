
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const validRoles = ["ADMIN", "USER"];

// POST /api/auth/register
// Registrasi publik selalu menghasilkan role USER.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, department_id } = req.body;

    if (!name || !email || !password || !department_id) {
      return res.status(400).json({
        message: "Nama, email, password, dan department_id wajib diisi.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password harus terdiri dari minimal 8 karakter.",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !Number.isSafeInteger(Number(department_id)) ||
      Number(department_id) <= 0
    ) {
      return res.status(400).json({
        message: "Format data tidak valid.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah terdaftar.",
      });
    }

    const departmentId = BigInt(department_id);

    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(400).json({
        message: "Department tidak ditemukan.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "USER",
        department_id: departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department_id: true,
      },
    });

    return res.status(201).json({
      message: "Registrasi berhasil.",
      data: {
        ...user,
        id: user.id.toString(),
        department_id: user.department_id.toString(),
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email dan password wajib diisi.",
      });
    }

    const user = await prisma.users.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Pesan dibuat sama agar tidak membocorkan apakah email terdaftar.
    if (!user) {
      return res.status(401).json({
        message: "Email atau password salah.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches || !validRoles.includes(user.role)) {
      return res.status(401).json({
        message: "Email atau password salah.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum dikonfigurasi.");

      return res.status(500).json({
        message: "Konfigurasi autentikasi belum tersedia.",
      });
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        subject: user.id.toString(),
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
    );

    return res.status(200).json({
      message: "Login berhasil.",
      token,
      data: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id.toString(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
});

export default router;
