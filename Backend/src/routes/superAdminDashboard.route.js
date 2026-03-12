import { Router } from "express";
import { 
    countUsers,
    countNGOAdmins
} from "../controllers/superAdminDashboard.controller.js";

const router = Router()

router.route("/count-users").get(countUsers);
router.route("/count-ngo-admins").get(countNGOAdmins);

export default router;