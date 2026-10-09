import { Router } from "express";
import { analyzeUrl } from "../controllers/analyze.controller.js";

const router = Router();

router.post("/", analyzeUrl);

export default router;