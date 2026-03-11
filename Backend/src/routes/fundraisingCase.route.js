import { Router } from "express";
import {
    createCase,
    getAllCases,
    getCaseById,
    updateCase,
    recordCaseDonation,
    releaseCaseFunds,
    closeCase,
    deleteCase
} from "../controllers/fundraisingCase.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllCases);
router.route("/:id").get(getCaseById);

// Super Admin routes
router.route("/create").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "documents", maxCount: 10 }
    ]),
    createCase
);

router.route("/:caseId/update").patch(
    verifyJWT,
    authorizeRoles("superAdmin"),
    upload.fields([
        { name: "images", maxCount: 10 }
    ]),
    updateCase
);

router.route("/:caseId/close").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    closeCase
);

router.route("/:caseId/release-funds").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    releaseCaseFunds
);

router.route("/:caseId/delete").delete(
    verifyJWT,
    authorizeRoles("superAdmin"),
    deleteCase
);
// Donation route (authenticated users)
router.route("/:caseId/donate").post(
    verifyJWT,
    recordCaseDonation
);

export default router;
