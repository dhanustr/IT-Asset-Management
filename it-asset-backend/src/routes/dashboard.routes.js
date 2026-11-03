
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /api/dashboard/summary
router.get(
  "/summary",
  allowRoles("ADMIN", "USER"),
  async (req, res) => {
    try {
      const isAdmin = req.user.role === "ADMIN";

      // USER hanya melihat tiket yang dibuat olehnya.
      const ticketWhere = isAdmin
        ? {}
        : { created_by: BigInt(req.user.id) };

      const [
        totalAssets,
        activeAssets,
        maintenanceAssets,
        retiredAssets,
        totalTickets,
        pendingTickets,
        approvedTickets,
        rejectedTickets,
        inProgressTickets,
        completedTickets,
      ] = await Promise.all([
        prisma.assets.count(),
        prisma.assets.count({
          where: { status: "ACTIVE" },
        }),
        prisma.assets.count({
          where: { status: "MAINTENANCE" },
        }),
        prisma.assets.count({
          where: { status: "RETIRED" },
        }),
        prisma.maintenance_tickets.count({
          where: ticketWhere,
        }),
        prisma.maintenance_tickets.count({
          where: { ...ticketWhere, status: "PENDING" },
        }),
        prisma.maintenance_tickets.count({
          where: { ...ticketWhere, status: "APPROVED" },
        }),
        prisma.maintenance_tickets.count({
          where: { ...ticketWhere, status: "REJECTED" },
        }),
        prisma.maintenance_tickets.count({
          where: { ...ticketWhere, status: "IN_PROGRESS" },
        }),
        prisma.maintenance_tickets.count({
          where: { ...ticketWhere, status: "COMPLETED" },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          assets: {
            total: totalAssets,
            active: activeAssets,
            maintenance: maintenanceAssets,
            retired: retiredAssets,
          },
          tickets: {
            total: totalTickets,
            pending: pendingTickets,
            approved: approvedTickets,
            rejected: rejectedTickets,
            in_progress: inProgressTickets,
            completed: completedTickets,
          },
        },
      });
    } catch (error) {
      console.error("Dashboard API error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data dashboard.",
      });
    }
  }
);

export default router;
