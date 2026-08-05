import { Router } from "express";
import { appointmentRoutes } from "./appointment";
import { serviceRoutes } from "./service";
import { webhookRoutes } from "./webhook";
import { authRoutes } from "./auth";

const router = Router();

router.use("/appointments", appointmentRoutes);
router.use("/services", serviceRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/auth", authRoutes);

export { router as routes };
