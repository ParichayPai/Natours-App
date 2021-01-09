const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1] Get Tour data
    const tours = await Tour.find(); 

    // 2] Build Template
    // 3] Render that template using tour data from 1]
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
})

exports.getTour = catchAsync(async (req, res, next) => {
    // 1] Get data for the req tour
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review ratings user'
    });

    // 2] Build Template
    // 3] Render that template using tour data from 1]
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        ) 
        .render('tour', {
            title: `${tour.name}`,
            tour,
        });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js"
        )
        .render('login', {
            title: `Login Page`,
        });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js"
        )
        .render('signup', {
            title: `Sign Up Page`,
        });
})

exports.getAccount = (req, res) => {
    res.status(200)
        .render('account', {
            title: `Your account`,
        });
}

exports.updateUserData = catchAsync ( async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },{
        new: true,
        runValidators: true
    });
    
    res.status(200).render('account', {
        title: `Your account`,
        user: updatedUser
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1] Find all the bookings
    const bookings = await Booking.find({ user: req.user.id})

    // 2] Find tours with the returned Ids
    const tourIds = bookings.map(ele => ele.tour.id);
    const tours = await Tour.find({ _id: { $in: tourIds } })

    res.status(200).render('overview', {
        title: 'My booked tours',
        tours
    })
})