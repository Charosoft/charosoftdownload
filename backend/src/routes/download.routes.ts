import { Router } from "express";
import { downloadUrl } from "../controllers/download.controller.js";

const router = Router();

router.post("/", downloadUrl);

export default router;