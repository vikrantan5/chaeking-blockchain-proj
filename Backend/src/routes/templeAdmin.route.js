import { Router } from "express";
import {
    storeWalletAddress,
    registerTempleAdmin,
    loginTempleAdmin,
    logoutTempleAdmin,
    refreshAccessTempleAdminToken,
    changeTempleAdminPassword,
    getCurrentTempleAdmin,
    getAllTempleAdmins,
    getActiveTempleAdmins,
    forDonationActiveTemple

} from "../controllers/templeAdmin.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();


router.route("/register-Temple-Admin").post(verifyJWT, authorizeRoles("superAdmin"), registerTempleAdmin);
router.route("/store-wallet-address").post(verifyJWT, authorizeRoles("templeAdmin"), storeWalletAddress);
router.route("/login-Temple-Admin").post(loginTempleAdmin);
router.route("/logout-Temple-Admin").post(verifyJWT, authorizeRoles("templeAdmin"), logoutTempleAdmin);
router.route("/refresh-token").post(refreshAccessTempleAdminToken);
router.route("/change-password").post(verifyJWT, authorizeRoles("templeAdmin"), changeTempleAdminPassword);
router.route("/get-current-Temple-Admin").get(verifyJWT, authorizeRoles("templeAdmin"), getCurrentTempleAdmin);
router.route("/get-all-Temple-Admins").get(verifyJWT, authorizeRoles("templeAdmin"), getAllTempleAdmins);
router.route("/get-active-Temple-Admins").get(verifyJWT, authorizeRoles("superAdmin"), getActiveTempleAdmins);
router.route("/for-donation-active-temple").get(forDonationActiveTemple);

export default router;