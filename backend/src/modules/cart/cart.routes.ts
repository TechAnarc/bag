import { Router } from "express";
import { CartController } from "./cart.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const cartController = new CartController();

// All cart routes require authentication
router.get("/", authenticate, (req, res) => cartController.getCart(req, res));
router.post("/calculate", (req, res) =>
	cartController.calculateTotals(req, res),
);
router.post("/items", authenticate, (req, res) =>
	cartController.addItem(req, res),
);
router.put("/items/:id", authenticate, (req, res) =>
	cartController.updateItem(req, res),
);
router.delete("/items/:id", authenticate, (req, res) =>
	cartController.removeItem(req, res),
);
router.delete("/", authenticate, (req, res) =>
	cartController.clearCart(req, res),
);

export default router;
