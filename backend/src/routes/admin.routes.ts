import { Router } from "express";
import { listUsers, setActive, setPremium, stats } from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/stats", stats);
router.get("/users", listUsers);
router.post("/users/:id/premium", setPremium);
router.post("/users/:id/active", setActive);

export default router;