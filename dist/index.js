"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const auth_1 = __importDefault(require("./routes/auth"));
const parents_1 = __importDefault(require("./routes/parents"));
const children_1 = __importDefault(require("./routes/children"));
const schools_1 = __importDefault(require("./routes/schools"));
const fees_1 = __importDefault(require("./routes/fees"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.use("/api/parents", parents_1.default);
app.use("/api/children", children_1.default);
app.use("/api/schools", schools_1.default);
app.use("/api/fees", fees_1.default);
app.get("/", (req, res) => {
    res.send("Bienvenue sur le backend EduPay !");
});
app.use(errorHandler_1.errorHandler);
app.listen(env_1.PORT, () => {
    console.log(`Server running on http://localhost:${env_1.PORT}`);
});
