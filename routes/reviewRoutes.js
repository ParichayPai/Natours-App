const express = require('express')
const reviewController = require("../controllers/reviewController");
const authController = require('../controllers/authController')

const router = express.Router({ mergeParams: true });
// So basically we merge both router ie params
// If the server faces /tours/ID/reviews or /reviews itll redirect to this route

router.use(authController.protect)

router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourIds, reviewController.createReview);

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('users', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('users', 'admin'), reviewController.deleteReview)
module.exports = router;