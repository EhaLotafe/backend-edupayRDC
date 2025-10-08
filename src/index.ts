import express from "express";
import cors from "cors";
import { PORT } from "./config/env";
import authRoutes from "./routes/auth";
import parentsRoutes from "./routes/parents";
import childrenRoutes from "./routes/children";
import schoolsRoutes from "./routes/schools";
import feesRoutes from "./routes/fees";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/parents", parentsRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/schools", schoolsRoutes);
app.use("/api/fees", feesRoutes);
app.get("/", (req, res) => {
  res.send("Bienvenue sur le backend EduPay !");
});
app.get("/api/test", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
