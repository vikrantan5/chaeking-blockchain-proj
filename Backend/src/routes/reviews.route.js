import {Router} from "express"
import {
    createReview,
    getReviewsForTemple,
    approveReview,
    deleteReview,
    getPublicReviewsForTemple
} from "../controllers/reviews.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
// Route to create a new review
router.route("/create-review").post(verifyJWT, authorizeRoles("user"), createReview);
router.route("/get-reviews/:templeId").get(verifyJWT, authorizeRoles("templeAdmin"), getReviewsForTemple);
router.route("/delete-review/:reviewId").delete(verifyJWT, authorizeRoles("user"), deleteReview);
router.route("/approve-review/:reviewId").post(verifyJWT, authorizeRoles("templeAdmin"), approveReview);
router.route("/public-reviews/:templeId").get(getPublicReviewsForTemple);

export default router;
