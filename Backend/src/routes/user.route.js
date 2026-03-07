import {Router} from "express"
import {
    storeWalletAddressForUser,
    registerUser, 
    verifyEmailWithOtp,
    resendOtp,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    requestPasswordReset,
    resendPasswordResetOtp,
    resetPasswordWithOtp, 
    getCurrentUser, 
} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js"


const router = Router()

router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmailWithOtp);
router.route("/resend-otp").post(resendOtp);
router.route("/store-wallet-address").post(verifyJWT, authorizeRoles("user"), storeWalletAddressForUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, authorizeRoles("user") ,logoutUser);
router.route("/refresh-Token").post(refreshAccessToken);
router.route("/change-password").post(requestPasswordReset);
router.route("/reset-password").post(resetPasswordWithOtp);
router.route("/resend-password-reset-otp").post(resendPasswordResetOtp);
router.route("/current-user").get(verifyJWT, getCurrentUser);


export default router