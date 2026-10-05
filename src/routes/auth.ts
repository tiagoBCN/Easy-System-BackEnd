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

    const { name, phone, password } = req.body;

    const created = await prisma.owner.create({
      data: {
        name: name || "Dono Stillus",
        phone: phone || "11999999999",
        password: hashPassword(password || "123456"),
      },
    });

    const { password: _, ...ownerData } = created;
    res.json({ message: "Dono padrão criado com sucesso", owner: ownerData });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao semear banco de dados", details: error.message });
  }
});

// Validar token e retornar dados do usuário autenticado
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      res.status(401).json({ error: "Token mal formatado" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "default_secret";
    const decoded: any = jwt.verify(parts[1], jwtSecret);

    if (decoded.role === "owner") {
      const owner = await prisma.owner.findUnique({ where: { id: decoded.id } });
      if (!owner) {
        res.status(401).json({ error: "Usuário não encontrado" });
        return;
      }
      const { password: _, ...ownerData } = owner;
      res.json({ user: ownerData, role: "owner" });
    } else if (decoded.role === "client") {
      res.json({
        user: { name: decoded.name, phone: decoded.id },
        role: "client",
      });
    } else {
      res.status(401).json({ error: "Role desconhecida" });
    }
  } catch (error: any) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

export const authRoutes = router;
