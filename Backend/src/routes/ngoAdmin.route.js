import { Router } from "express";
import {
    registerNGOOwner,
    loginNGOAdmin,
    logoutNGOAdmin,
    getCurrentNGOAdmin,
    storeWalletAddressForNGOAdmin
} from "../controllers/ngoAdmin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "verificationDocuments", maxCount: 10 }
    ]),
    registerNGOOwner
);
router.route("/login").post(loginNGOAdmin);

// Protected routes
router.route("/logout").post(verifyJWT, authorizeRoles("ngoAdmin"), logoutNGOAdmin);
router.route("/current").get(verifyJWT, authorizeRoles("ngoAdmin"), getCurrentNGOAdmin);
router.route("/store-wallet-address").post(verifyJWT, authorizeRoles("ngoAdmin"), storeWalletAddressForNGOAdmin);

export default router;
