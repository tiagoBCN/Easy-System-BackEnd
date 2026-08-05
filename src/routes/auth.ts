import { Router } from "express";
import { prisma } from "../lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Login do Dono
router.post("/login/owner", async (req, res) => {
  try {
    const { celular, senha } = req.body;
    if (!celular || !senha) {
      res.status(400).json({ error: "Celular e senha são obrigatórios" });
      return;
    }

    const owner = await prisma.owner.findUnique({
      where: { phone: celular },
    });

    if (!owner) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const hashed = hashPassword(senha);
    if (owner.password !== hashed) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ id: owner.id, role: "owner" }, jwtSecret, { expiresIn: "1d" });

    const { password: _, ...ownerData } = owner;
    res.json({ success: true, token, user: ownerData, role: "owner" });
  } catch (error: any) {
    res.status(500).json({ error: "Erro no login do dono", details: error.message });
  }
});

// Login do Cliente/Usuário
router.post("/login/client", async (req, res) => {
  try {
    const { nome, celular } = req.body;
    if (!nome || !celular) {
      res.status(400).json({ error: "Nome e celular são obrigatórios" });
      return;
    }

    // Verifica se o cliente já realizou algum agendamento no sistema
    const hasAppointments = await prisma.appointment.findFirst({
      where: {
        clientName: nome,
        clientPhone: celular,
      },
    });

    const jwtSecret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ id: celular, role: "client", name: nome }, jwtSecret, { expiresIn: "1d" });

    res.json({
      success: true,
      token,
      user: { name: nome, phone: celular },
      role: "client",
      isNew: !hasAppointments,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro no login do cliente", details: error.message });
  }
});

// Rota de Seed para criar o Dono de teste
router.post("/seed", async (req, res) => {
  try {
    const ownerExists = await prisma.owner.findFirst();
    if (ownerExists) {
      res.status(400).json({ error: "Dono já cadastrado no sistema" });
      return;
    }

    const created = await prisma.owner.create({
      data: {
        name: "Dono Stillus",
        phone: "11999999999",
        password: hashPassword("123456"),
      },
    });

    const { password: _, ...ownerData } = created;
    res.json({ message: "Dono padrão criado com sucesso", owner: ownerData });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao semear banco de dados", details: error.message });
  }
});

export const authRoutes = router;
