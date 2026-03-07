import { Router } from 'express';
import {
    addCarouselImage,
    getAllCarouselImages,
    updateCarouselImage,
    deleteCarouselImage
} from '../controllers/carousel.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Route to create a new carousel image
router.route('/create-carousel').post(verifyJWT, authorizeRoles('superAdmin'), addCarouselImage,);
// Route to get all carousel images
router.route('/get-carousel').get(getAllCarouselImages);
// Route to update a carousel image by ID
router.route('/update-carousel/:id').put(verifyJWT, authorizeRoles('superAdmin'), updateCarouselImage);
// Route to delete a carousel image by ID
router.route('/delete-carousel/:id').delete(verifyJWT, authorizeRoles('superAdmin'), deleteCarouselImage);

export default router;