
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

import {
  parsePagination,
  paginationMeta,
} from "../utils/pagination.js";

const router = Router();
const prisma = new PrismaClient();

const allowedStatuses = ["ACTIVE", "MAINTENANCE", "RETIRED"];
const requiredFields = [
  "asset_code",
  "name",
  "category",
  "location",
  "department_id",
];

// Mengubah BigInt menjadi string agar aman dikirim sebagai JSON.
function sendJson(res, status, data) {
  const json = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  return res.status(status).json(json);
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function validateAsset(body, partial = false) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body harus berupa JSON object."];
  }

  const allowedFields = [
    "asset_code",
    "name",
    "category",
    "brand",
    "serial_number",
    "location",
    "assigned_to",
    "department_id",
    "status",
  ];

  for (const key of Object.keys(body)) {
    if (!allowedFields.includes(key)) {
      errors.push(`Field '${key}' tidak diizinkan.`);
    }
  }

  if (!partial) {
    for (const field of requiredFields) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ""
      ) {
        errors.push(`Field '${field}' wajib diisi.`);
      }
    }
  }

  for (const field of [
    "asset_code",
    "name",
    "category",
    "location",
  ]) {
    if (body[field] !== undefined) {
      if (
        typeof body[field] !== "string" ||
        body[field].trim() === ""
      ) {
        errors.push(`Field '${field}' harus berupa teks dan tidak boleh kosong.`);
      }
    }
  }

  for (const field of ["brand", "serial_number"]) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== "string"
    ) {
      errors.push(`Field '${field}' harus berupa teks atau null.`);
    }
  }

  for (const field of ["department_id", "assigned_to"]) {
    if (
      body[field] !== undefined &&
      body[field] !== null
    ) {
      if (
        !(
          typeof body[field] === "string" ||
          (typeof body[field] === "number" &&
            Number.isSafeInteger(body[field]))
        ) ||
        !/^[1-9]\d*$/.test(String(body[field]))
      ) {
        errors.push(`Field '${field}' harus berupa ID positif atau null.`);
      }
    }
  }

  if (
    body.department_id === null ||
    body.department_id === ""
  ) {
    errors.push("Field 'department_id' wajib berupa ID departemen yang valid.");
  }

  if (
    body.status !== undefined &&
    !allowedStatuses.includes(body.status)
  ) {
    errors.push(
      `Status harus salah satu dari: ${allowedStatuses.join(", ")}.`
    );
  }

  return errors;
}

function toPrismaData(body) {
  const data = {};

  for (const field of [
    "asset_code",
    "name",
    "category",
    "location",
    "status",
  ]) {
    if (body[field] !== undefined) {
      data[field] = body[field].trim();
    }
  }

  for (const field of ["brand", "serial_number"]) {
    if (body[field] !== undefined) {
      data[field] =
        body[field] === null ? null : body[field].trim();
    }
  }

  if (body.department_id !== undefined) {
    data.department_id = BigInt(body.department_id);
  }

  if (body.assigned_to !== undefined) {
    data.assigned_to =
      body.assigned_to === null
        ? null
        : BigInt(body.assigned_to);
  }

  return data;
}

function handleDatabaseError(res, error) {
  if (error?.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Kode aset sudah digunakan.",
    });
  }

  if (error?.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Relasi departemen atau PIC tidak valid.",
    });
  }

  if (error?.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Aset tidak ditemukan.",
    });
  }

  console.error("Asset API error:", error);

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server.",
  });
}

// GET /api/assets — daftar aset
router.get("/", authenticateToken, async (req, res) => {
  try {
    
const {
  search,
  status,
  category,
  department_id,
} = req.query;

const pagination = parsePagination(req.query);

if (pagination.error) {
  return res.status(400).json({
    success: false,
    message: pagination.error,
  });
}

const { page, limit, skip } = pagination;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Filter status tidak valid.",
      });
    }

    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;

    if (department_id !== undefined) {
      const id = parseId(department_id);

      if (id === null) {
        return res.status(400).json({
          success: false,
          message: "department_id harus berupa ID positif.",
        });
      }

      where.department_id = id;
    }

    if (search) {
      const term = search.trim();

      if (term.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Kata pencarian terlalu panjang.",
        });
      }

      where.OR = [
        { asset_code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { brand: { contains: term, mode: "insensitive" } },
        { serial_number: { contains: term, mode: "insensitive" } },
      ];
    }

    
const [assets, total] = await Promise.all([
  prisma.assets.findMany({
    where,
    orderBy: { id: "desc" },
    skip,
    take: limit,
  }),
  prisma.assets.count({ where }),
]);

return sendJson(res, 200, {
  success: true,
  count: assets.length,
  data: assets,
  pagination: paginationMeta(page, limit, total),
});
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

// GET /api/assets/:id — detail aset
router.get("/:id", authenticateToken, async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID aset tidak valid.",
    });
  }

  try {
    const asset = await prisma.assets.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Aset tidak ditemukan.",
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: asset,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

// POST /api/assets — tambah aset
router.post("/", authenticateToken, allowRoles("ADMIN"), async (req, res) => {
  const errors = validateAsset(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  try {
    const asset = await prisma.assets.create({
      data: toPrismaData(req.body),
    });

    return sendJson(res, 201, {
      success: true,
      message: "Aset berhasil ditambahkan.",
      data: asset,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

// PUT /api/assets/:id — mengganti data aset
router.put("/:id", authenticateToken, allowRoles("ADMIN"), async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID aset tidak valid.",
    });
  }

  const errors = validateAsset(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  try {
    const asset = await prisma.assets.update({
      where: { id },
      data: toPrismaData(req.body),
    });

    return sendJson(res, 200, {
      success: true,
      message: "Aset berhasil diperbarui.",
      data: asset,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

// PATCH /api/assets/:id — mengubah sebagian data
router.patch("/:id", authenticateToken, allowRoles("ADMIN"), async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID aset tidak valid.",
    });
  }

  const errors = validateAsset(req.body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Minimal satu field harus dikirim.",
    });
  }

  try {
    const asset = await prisma.assets.update({
      where: { id },
      data: toPrismaData(req.body),
    });

    return sendJson(res, 200, {
      success: true,
      message: "Aset berhasil diperbarui.",
      data: asset,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

// DELETE /api/assets/:id — hapus aset
router.delete("/:id", authenticateToken, allowRoles("ADMIN"), async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID aset tidak valid.",
    });
  }

  try {
    await prisma.assets.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Aset berhasil dihapus.",
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

export default router;
