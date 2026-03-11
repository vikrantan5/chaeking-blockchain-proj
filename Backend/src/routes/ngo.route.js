import { Router } from "express";
import {
    registerNGO,
    getAllNGOs,
    getNGOById,
    approveNGO,
    rejectNGO,
    updateNGO,
    deleteNGO,
    getNGODashboard
} from "../controllers/ngo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllNGOs);
router.route("/:id").get(getNGOById);

// Protected routes
router.route("/register").post(
    verifyJWT,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "verificationDocuments", maxCount: 10 }
    ]),
    registerNGO
);

router.route("/dashboard").get(
    verifyJWT,
      authorizeRoles("ngoAdmin"),
    getNGODashboard
);

router.route("/:ngoId/update").patch(
    verifyJWT,
    authorizeRoles("superAdmin", "ngoAdmin"),
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "photoGallery", maxCount: 10 }
    ]),
    updateNGO
);

// Super Admin only routes
router.route("/:ngoId/approve").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    approveNGO
);

router.route("/:ngoId/reject").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    rejectNGO
);

router.route("/:ngoId/delete").delete(
    verifyJWT,
    authorizeRoles("superAdmin"),
    deleteNGO
);

export default router;
