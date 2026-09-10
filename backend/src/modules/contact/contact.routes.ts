import { Router } from "express";
import { ContactController } from "./contact.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const contactController = new ContactController();

// Public route
router.post("/", (req, res) => contactController.submitForm(req, res));

// Admin routes
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";
import multer from "multer";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
});

router.get("/", authenticateAdmin, (req, res) =>
	contactController.getAllSubmissions(req, res),
);
router.patch("/:id/read", authenticateAdmin, (req, res) =>
	contactController.markAsRead(req, res),
);
router.post(
	"/:id/reply",
	authenticateAdmin,
	upload.array("attachments"),
	(req, res) => contactController.sendReply(req, res),
);

export default router;
