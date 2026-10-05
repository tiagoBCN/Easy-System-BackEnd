import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

// Listar todos os agendamentos (owner vê tudo, client vê apenas os seus)
router.get("/", authMiddleware, async (req: any, res) => {
  try {
    const { role, id, name } = req.user;

    let whereClause = {};
    if (role === "client") {
      // Cliente só vê seus próprios agendamentos
      whereClause = { clientPhone: id };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    res.json(appointments);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Erro ao buscar agendamentos", details: error.message });
  }
});

// Criar um agendamento (clientes e owner podem criar)
router.post("/", authMiddleware, roleMiddleware("owner"), async (req, res)  => {
  try {
    const { clientName, clientPhone, date, serviceId, status } = req.body;
    if (!clientName || !clientPhone || !date || !serviceId) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }
    const appointment = await prisma.appointment.create({
      data: {
        clientName,
        clientPhone,
        date: new Date(date),
        serviceId,
        status: status || "PENDING",
      },
      include: {
        service: true,
      },
    });
    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao agendar", details: error.message });
  }
});

// Atualizar o status de um agendamento (apenas owner)
router.patch("/:id/status", authMiddleware, roleMiddleware("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "Status é obrigatório" });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: true },
    });

    res.json(updated);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Erro ao atualizar status", details: error.message });
  }
});

// Deletar agendamento (apenas owner)
router.delete("/:id", authMiddleware, roleMiddleware("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({ where: { id } });
    res.json({ message: "Agendamento removido com sucesso" });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Erro ao remover agendamento", details: error.message });
  }
});

export const appointmentRoutes = router;
