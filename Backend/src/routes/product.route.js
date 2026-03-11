import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    recordProductDonation,
    updateProductStock,
    deleteProduct,
    getProductCategories
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllProducts);
router.route("/categories").get(getProductCategories);
router.route("/:id").get(getProductById);

// Super Admin routes
router.route("/create").post(
    verifyJWT,
    authorizeRoles("superAdmin"),
    upload.fields([
        { name: "images", maxCount: 10 }
    ]),
    createProduct
);

router.route("/:productId/update").patch(
    verifyJWT,
    authorizeRoles("superAdmin"),
    upload.fields([
        { name: "images", maxCount: 10 }
    ]),
    updateProduct
);

router.route("/:productId/stock").patch(
    verifyJWT,
    authorizeRoles("superAdmin"),
    updateProductStock
);

router.route("/:productId/delete").delete(
    verifyJWT,
    authorizeRoles("superAdmin"),
    deleteProduct
);

// Donation route (authenticated users)
router.route("/:productId/donate").post(
    verifyJWT,
    recordProductDonation
);

export default router;
