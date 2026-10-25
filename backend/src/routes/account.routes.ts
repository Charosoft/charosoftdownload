import { Router } from "express";
import { clearHistory, history } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/history", history);
router.post("/history/clear", clearHistory);

export default router;