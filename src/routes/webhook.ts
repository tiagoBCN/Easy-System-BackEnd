import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Webhook Genérico de Confirmação de Agendamento
router.post("/appointment", async (req, res) => {
  try {
    const { clientName, clientPhone, date, serviceId, status } = req.body;

    if (!clientName || !clientPhone || !date || !serviceId) {
      res.status(400).json({
        error: "Campos obrigatórios ausentes: clientName, clientPhone, date, serviceId"
      });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName,
        clientPhone,
        date: new Date(date),
        serviceId,
        status: status || "CONFIRMED"
      },
      include: {
        service: true
      }
    });

    console.log(`✅ Agendamento confirmado via webhook genérico para: ${clientName}`);
    res.status(201).json({
      message: "Agendamento criado com sucesso via Webhook!",
      appointment
    });
  } catch (error: any) {
    console.error("Erro no Webhook:", error);
    res.status(500).json({
      error: "Erro interno ao processar o webhook",
      details: error.message
    });
  }
});

// WhatsApp Webhook: Validação da URL da Meta (GET)
router.get("/whatsapp", (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "meu_token_secreto";
  
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verificado pela Meta!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// WhatsApp Webhook: Recebimento de Mensagens (POST)
router.post("/whatsapp", async (req, res) => {
  try {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message && message.type === "text") {
        const clientPhone = message.from;
        const messageText = message.text.body.trim().toUpperCase();

        console.log(`Mensagem recebida de ${clientPhone}: "${messageText}"`);

        if (messageText === "SIM" || messageText === "1" || messageText === "CONFIRMO") {
          const appointment = await prisma.appointment.findFirst({
            where: {
              clientPhone: clientPhone,
              status: "PENDING",
            },
            orderBy: {
              date: "desc",
            },
          });

          if (appointment) {
            const updated = await prisma.appointment.update({
              where: { id: appointment.id },
              data: { status: "CONFIRMED" },
              include: {
                service: true
              }
            });
            console.log(`✅ Agendamento ${appointment.id} confirmado para ${clientPhone}`);
            res.status(200).json({ status: "success", appointment: updated });
            return;
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error: any) {
    console.error("Erro no Webhook do WhatsApp:", error);
    res.status(500).json({ error: "Erro interno", details: error.message });
  }
});

export const webhookRoutes = router;
