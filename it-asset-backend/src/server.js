import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import assetsRouter from "./routes/assets.routes.js";
import authRouter from "./routes/auth.routes.js";
import { authenticateToken } from "./middleware/auth.middleware.js";
import maintenanceRouter from "./routes/maintenance.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import departmentRoutes from "./routes/departments.routes.js";
import usersRouter from "./routes/users.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware harus dipasang sebelum routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "IT Asset & Maintenance API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend berjalan dengan baik",
  });
});

app.use("/api/auth", authRouter);

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Token valid.",
    data: req.user,
  });
});
app.use("/api/departments", departmentRoutes);
app.use("/api/users", usersRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/dashboard", dashboardRouter);
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
