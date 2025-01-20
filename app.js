import express from "express";
import path from "path";
import fs from "fs";
import imageRoutes from "./src/routes/imageRoutes.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Configure dotenv
dotenv.config();

const app = express();
// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));
app.use("/api/v1/images", imageRoutes);

export default app;
