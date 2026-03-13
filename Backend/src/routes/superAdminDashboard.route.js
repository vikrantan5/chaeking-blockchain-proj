import { Router } from "express";
import { 
    countUsers,
    countNGOAdmins,
    getProductSalesHistory
} from "../controllers/superAdminDashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
const router = Router()

router.route("/count-users").get(countUsers);
router.route("/count-ngo-admins").get(countNGOAdmins);
router.route("/product-sales").get(verifyJWT, authorizeRoles("superAdmin"), getProductSalesHistory);

export default router;