
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  parsePagination,
  paginationMeta,
} from "../utils/pagination.js";

const router = Router();
const prisma = new PrismaClient();

const allowedStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
];

const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const ticketInclude = {
  assets: {
    select: {
      id: true,
      asset_code: true,
      name: true,
      category: true,
      location: true,
      status: true,
    },
  },
  users_maintenance_tickets_created_byTousers: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  users_maintenance_tickets_approved_byTousers: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

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
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function createTicketCode() {
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `MT-${Date.now()}-${suffix}`;
}

function handleDatabaseError(res, error) {
  if (error?.httpStatus) {
    return res.status(error.httpStatus).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Kode tiket sudah digunakan. Silakan coba kembali.",
    });
  }

  if (error?.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Relasi aset atau pengguna tidak valid.",
    });
  }

  if (error?.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Data tidak ditemukan.",
    });
  }

  console.error("Maintenance API error:", error);

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server.",
  });
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

// Semua endpoint maintenance memerlukan token.
router.use(authenticateToken);

// GET /api/maintenance/tickets
// ADMIN melihat semua tiket; USER hanya melihat tiket miliknya.
router.get(
  "/tickets",
  allowRoles("ADMIN", "USER"),
  async (req, res) => {
    try {
      const { status, priority, asset_id } = req.query;
    const pagination = parsePagination(req.query);

    if (pagination.error) {
        return res.status(400).json({
        success: false,
        message: pagination.error,
  });
}

const { page, limit, skip } = pagination;

      const where = {};

      if (status !== undefined) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Filter status tidak valid.",
          });
        }

        where.status = status;
      }

      if (priority !== undefined) {
        if (!allowedPriorities.includes(priority)) {
          return res.status(400).json({
            success: false,
            message: "Filter priority tidak valid.",
          });
        }

        where.priority = priority;
      }

      if (asset_id !== undefined) {
        const id = parseId(asset_id);

        if (id === null) {
          return res.status(400).json({
            success: false,
            message: "asset_id harus berupa ID positif.",
          });
        }

        where.asset_id = id;
      }

      if (req.user.role === "USER") {
        where.created_by = BigInt(req.user.id);
      }

      
const [tickets, total] = await Promise.all([
  prisma.maintenance_tickets.findMany({
    where,
    include: ticketInclude,
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  }),
  prisma.maintenance_tickets.count({ where }),
]);

return sendJson(res, 200, {
  success: true,
  count: tickets.length,
  data: tickets,
  pagination: paginationMeta(page, limit, total),
});

    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// POST /api/maintenance/tickets
// ADMIN langsung APPROVED; USER mulai dari PENDING.
router.post(
  "/tickets",
  allowRoles("ADMIN", "USER"),
  async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Request body harus berupa JSON object.",
      });
    }

    const allowedFields = [
      "asset_id",
      "priority",
      "problem",
      "description",
    ];

    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Field tidak diizinkan: ${unknownFields.join(", ")}.`,
      });
    }

    const assetId = parseId(String(body.asset_id ?? ""));

    if (assetId === null) {
      return res.status(400).json({
        success: false,
        message: "asset_id wajib berupa ID positif.",
      });
    }

    if (
      typeof body.problem !== "string" ||
      body.problem.trim() === "" ||
      body.problem.trim().length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "problem wajib diisi dan maksimal 200 karakter.",
      });
    }

    if (
      body.priority !== undefined &&
      !allowedPriorities.includes(body.priority)
    ) {
      return res.status(400).json({
        success: false,
        message: `priority harus salah satu dari: ${allowedPriorities.join(", ")}.`,
      });
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "description harus berupa teks atau null.",
      });
    }

    if (
      typeof body.description === "string" &&
      body.description.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "description maksimal 5000 karakter.",
      });
    }

    try {
      const asset = await prisma.assets.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: "Aset tidak ditemukan.",
        });
      }

      if (asset.status === "RETIRED") {
        return res.status(400).json({
          success: false,
          message: "Tiket tidak dapat dibuat untuk aset yang sudah retired.",
        });
      }

      const isAdmin = req.user.role === "ADMIN";

      const ticket = await prisma.maintenance_tickets.create({
        data: {
          ticket_code: createTicketCode(),
          asset_id: assetId,
          created_by: BigInt(req.user.id),
          approved_by: isAdmin ? BigInt(req.user.id) : null,
          status: isAdmin ? "APPROVED" : "PENDING",
          priority: body.priority ?? "MEDIUM",
          problem: body.problem.trim(),
          description:
            typeof body.description === "string"
              ? body.description.trim() || null
              : null,
        },
        include: ticketInclude,
      });

      return sendJson(res, 201, {
        success: true,
        message: isAdmin
          ? "Tiket berhasil dibuat dengan status APPROVED."
          : "Tiket berhasil diajukan dan menunggu persetujuan ADMIN.",
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// GET /api/maintenance/history
// Riwayat pemeliharaan yang sudah selesai.

 // GET /api/maintenance/history
 // Riwayat pemeliharaan yang sudah selesai.
router.get(
  "/history",
  allowRoles("ADMIN", "USER"),
  async (req, res) => {
    try {
      // 1. Validasi pagination
      const pagination = parsePagination(req.query);

      if (pagination.error) {
        return res.status(400).json({
          success: false,
          message: pagination.error,
        });
      }

      const { page, limit, skip } = pagination;

      // 2. Filter riwayat
      const { asset_id } = req.query;
      const where = { status: "COMPLETED" };

      if (asset_id !== undefined) {
        const id = parseId(asset_id);

        if (id === null) {
          return res.status(400).json({
            success: false,
            message: "asset_id harus berupa ID positif.",
          });
        }

        where.asset_id = id;
      }

      // 3. Ambil data dan hitung total secara bersamaan
      const [history, total] = await Promise.all([
        prisma.maintenance_tickets.findMany({
          where,
          include: ticketInclude,
          orderBy: { completed_at: "desc" },
          skip,
          take: limit,
        }),

        prisma.maintenance_tickets.count({ where }),
      ]);

      // 4. Kirim respons beserta metadata pagination
      return sendJson(res, 200, {
        success: true,
        count: history.length,
        data: history,
        pagination: paginationMeta(page, limit, total),
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);


// GET /api/maintenance/tickets/:id
router.get(
  "/tickets/:id",
  allowRoles("ADMIN", "USER"),
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        success: false,
        message: "ID tiket tidak valid.",
      });
    }

    try {
      const ticket = await prisma.maintenance_tickets.findUnique({
        where: { id },
        include: ticketInclude,
      });

      if (
        !ticket ||
        (req.user.role === "USER" &&
          ticket.created_by !== BigInt(req.user.id))
      ) {
        return res.status(404).json({
          success: false,
          message: "Tiket tidak ditemukan.",
        });
      }

      return sendJson(res, 200, {
        success: true,
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// PATCH /api/maintenance/tickets/:id/approve
router.patch(
  "/tickets/:id/approve",
  allowRoles("ADMIN"),
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        success: false,
        message: "ID tiket tidak valid.",
      });
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const current = await tx.maintenance_tickets.findUnique({
          where: { id },
        });

        if (!current) {
          throw createHttpError(404, "Tiket tidak ditemukan.");
        }

        if (current.status !== "PENDING") {
          throw createHttpError(
            409,
            "Hanya tiket PENDING yang dapat disetujui."
          );
        }

        return tx.maintenance_tickets.update({
          where: { id },
          data: {
            status: "APPROVED",
            approved_by: BigInt(req.user.id),
            rejection_reason: null,
          },
          include: ticketInclude,
        });
      });

      return sendJson(res, 200, {
        success: true,
        message: "Tiket berhasil disetujui.",
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// PATCH /api/maintenance/tickets/:id/reject
router.patch(
  "/tickets/:id/reject",
  allowRoles("ADMIN"),
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        success: false,
        message: "ID tiket tidak valid.",
      });
    }

    const reason = req.body?.rejection_reason;

    if (
      typeof reason !== "string" ||
      reason.trim() === "" ||
      reason.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "rejection_reason wajib diisi, maksimal 2000 karakter.",
      });
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const current = await tx.maintenance_tickets.findUnique({
          where: { id },
        });

        if (!current) {
          throw createHttpError(404, "Tiket tidak ditemukan.");
        }

        if (current.status !== "PENDING") {
          throw createHttpError(
            409,
            "Hanya tiket PENDING yang dapat ditolak."
          );
        }

        return tx.maintenance_tickets.update({
          where: { id },
          data: {
            status: "REJECTED",
            approved_by: BigInt(req.user.id),
            rejection_reason: reason.trim(),
          },
          include: ticketInclude,
        });
      });

      return sendJson(res, 200, {
        success: true,
        message: "Tiket berhasil ditolak.",
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// PATCH /api/maintenance/tickets/:id/start
router.patch(
  "/tickets/:id/start",
  allowRoles("ADMIN"),
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        success: false,
        message: "ID tiket tidak valid.",
      });
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const current = await tx.maintenance_tickets.findUnique({
          where: { id },
          include: { assets: true },
        });

        if (!current) {
          throw createHttpError(404, "Tiket tidak ditemukan.");
        }

        if (current.status !== "APPROVED") {
          throw createHttpError(
            409,
            "Hanya tiket APPROVED yang dapat dimulai."
          );
        }

        if (current.assets.status === "RETIRED") {
          throw createHttpError(
            409,
            "Aset sudah retired dan tidak dapat diproses."
          );
        }

        await tx.assets.update({
          where: { id: current.asset_id },
          data: { status: "MAINTENANCE" },
        });

        return tx.maintenance_tickets.update({
          where: { id },
          data: {
            status: "IN_PROGRESS",
            started_at: new Date(),
          },
          include: ticketInclude,
        });
      });

      return sendJson(res, 200, {
        success: true,
        message: "Pemeliharaan dimulai. Status aset menjadi MAINTENANCE.",
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

// PATCH /api/maintenance/tickets/:id/complete
router.patch(
  "/tickets/:id/complete",
  allowRoles("ADMIN"),
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        success: false,
        message: "ID tiket tidak valid.",
      });
    }

    const notes = req.body?.completion_notes;

    if (
      typeof notes !== "string" ||
      notes.trim() === "" ||
      notes.trim().length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "completion_notes wajib diisi, maksimal 5000 karakter.",
      });
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const current = await tx.maintenance_tickets.findUnique({
          where: { id },
        });

        if (!current) {
          throw createHttpError(404, "Tiket tidak ditemukan.");
        }

        if (current.status !== "IN_PROGRESS") {
          throw createHttpError(
            409,
            "Hanya tiket IN_PROGRESS yang dapat diselesaikan."
          );
        }

        const asset = await tx.assets.findUnique({
          where: { id: current.asset_id },
          select: { status: true },
        });

        if (!asset) {
          throw createHttpError(404, "Aset terkait tidak ditemukan.");
        }

        // Jangan mengaktifkan kembali aset yang sudah retired.
        if (asset.status !== "RETIRED") {
          await tx.assets.update({
            where: { id: current.asset_id },
            data: { status: "ACTIVE" },
          });
        }

        return tx.maintenance_tickets.update({
          where: { id },
          data: {
            status: "COMPLETED",
            completion_notes: notes.trim(),
            completed_at: new Date(),
          },
          include: ticketInclude,
        });
      });

      return sendJson(res, 200, {
        success: true,
        message: "Pemeliharaan selesai. Riwayat berhasil dicatat.",
        data: ticket,
      });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  }
);

export default router;
