import dotenv from "dotenv";
dotenv.config(); // ✅ moved to top before anything uses process.env

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Uncomment the middlewares if you use them
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from './routes/user.routes.js';
app.use("/api/v1/users", userRouter);

export { app };
