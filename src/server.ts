import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes } from "./routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota de status simples
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    message: "Barbearia Stillus Men API está online!",
    timestamp: new Date()
  });
});

// Registrar rotas modulares
app.use("/api", routes);

app.listen(port, () => {
  console.log(`⚡️ Servidor rodando em http://localhost:${port}`);
});

export { app };
