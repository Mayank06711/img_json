import express from "express";
import upload from "../utils/multer.js";
import { uploadImage, parseImage } from "../controller/imageController.js";

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);
router.post("/parse", parseImage);

export default router;
