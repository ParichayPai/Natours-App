const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express();

// router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/signup', viewsController.getSignupForm)
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours); //bookingController.createBookingCheckout, 

router.post('/submit-user-data',authController.protect, viewsController.updateUserData);

module.exports = router;