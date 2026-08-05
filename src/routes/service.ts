import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Listar todos os serviços
router.get("/", async (req, res) => {
  try {
    const servicesList = await prisma.service.findMany();
    res.json(servicesList);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar serviços", details: error.message });
  }
});

// Criar um novo serviço
router.post("/", authMiddleware, async (req, res) => {
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

export const serviceRoutes = router;
