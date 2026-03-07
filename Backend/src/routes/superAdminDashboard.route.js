import { Router } from "express";
import { 
    countUsers,
    countTempleAdmins
} from "../controllers/superAdminDashboard.controller.js";

const router = Router()

router.route("/count-users").get(countUsers);
router.route("/count-temple-admins").get(countTempleAdmins);

export default router;