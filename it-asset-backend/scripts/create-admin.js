
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prisma = new PrismaClient();
const rl = readline.createInterface({ input: stdin, output: stdout });

try {
  const name = (await rl.question("Nama ADMIN: ")).trim();
  const email = (await rl.question("Email ADMIN: "))
    .trim()
    .toLowerCase();
  const password = await rl.question("Password ADMIN: ");
  const departmentInput = (
    await rl.question("Department ID: ")
  ).trim();

  if (!name || !email || password.length < 8) {
    throw new Error(
      "Nama dan email wajib diisi; password minimal 8 karakter."
    );
  }

  if (!/^[1-9]\d*$/.test(departmentInput)) {
    throw new Error("Department ID harus berupa bilangan bulat positif.");
  }

  const departmentId = BigInt(departmentInput);

  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email sudah digunakan oleh akun lain.");
  }

  const department = await prisma.departments.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new Error(
      "Department tidak ditemukan. Periksa ID department di database."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      department_id: departmentId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("\nAkun ADMIN berhasil dibuat!");
  console.log(admin);
} catch (error) {
  console.error("\nGagal membuat ADMIN:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
