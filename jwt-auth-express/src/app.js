import express, { json } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes.js";

const app = express();

app.use(json());
app.use(cookieParser());
app.use(morgan("dev"))
app.use("/api/v1/auth", authRouter);

export default app;
