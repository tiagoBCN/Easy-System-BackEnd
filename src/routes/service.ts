import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

// Listar todos os serviços (público — clientes precisam ver para agendar)
router.get("/", async (req, res) => {
  try {
    const servicesList = await prisma.service.findMany({
      orderBy: { name: "asc" },
    });
    res.json(servicesList);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar serviços", details: error.message });
  }
});

// Criar um novo serviço (apenas owner)
router.post("/", authMiddleware, roleMiddleware("owner"), async (req, res) => {
  try {
    const { name, description, price, durationMin } = req.body;
    if (!name || !price || !durationMin) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }
    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        durationMin
      }
    });
    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao criar serviço", details: error.message });
  }
});

// Atualizar um serviço (apenas owner)
router.put("/:id", authMiddleware, roleMiddleware("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationMin } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(durationMin && { durationMin }),
      },
    });
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar serviço", details: error.message });
  }
});

// Deletar um serviço (apenas owner)
router.delete("/:id", authMiddleware, roleMiddleware("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    res.json({ message: "Serviço removido com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao remover serviço", details: error.message });
  }
});

export const serviceRoutes = router;
