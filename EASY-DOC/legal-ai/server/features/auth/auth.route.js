import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }

  const token = jwt.sign(
    { name, email, id: Date.now().toString() },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );

  res.json({
    id: Date.now().toString(),
    name,
    email,
    token
  });
});

export default router;
