import {Router} from "express"
import {
    seedScriptForSuperAdmin,
    loginSuperAdmin,
    logoutSuperAdmin,
    refreshAccessToken,
    changePassword,
    getCurrentSuperAdmin,
    confirmTempleAdminRegistration,
    rejectTempleAdminRegistration,
    getPendingConfirmations,
} from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js"


const router = Router()

// router.route("/seed-script").post(seedScriptForSuperAdmin);   // if you want to add first superAdmin so temporarely active this route and after creating, active below route
router.route("/seed-script").post(verifyJWT, authorizeRoles('superAdmin'), seedScriptForSuperAdmin);
router.route("/login-superAdmin").post(loginSuperAdmin);
router.route("/logout-superAdmin").post(verifyJWT, authorizeRoles("superAdmin"), logoutSuperAdmin);
router.route("/refresh-Access-Token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, authorizeRoles("superAdmin"), changePassword);
router.route("/current-superAdmin").get(verifyJWT, authorizeRoles("superAdmin"), getCurrentSuperAdmin);
router.route("/confirm-temple-admin-registration").post(verifyJWT, authorizeRoles("superAdmin"), confirmTempleAdminRegistration);
router.route("/reject-temple-admin-registration").post(verifyJWT, authorizeRoles("superAdmin"), rejectTempleAdminRegistration);
router.route("/get-pending-confirmations").get(verifyJWT, authorizeRoles("superAdmin"), getPendingConfirmations);

export default router