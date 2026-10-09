import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CHAROSOFT DOWNLOAD API opérationnelle"
  });
});

export default router;