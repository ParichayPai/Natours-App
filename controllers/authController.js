const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError')
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = async (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production')
        cookieOptions.secure = true; // For https
    
    res.cookie('jwt', token, cookieOptions);

    //Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if(!email || !password){
        return next(new AppError('Please provide email and password!', 400))
    }

    const user = await User.findOne({ email }).select('+password');
    // const correct = await user.correctPassword(password, user.password);

    if( !user || !(await user.correctPassword(password, user.password)) ){
        return next(new AppError("Incorrect email or password", 401))
    }


    createSendToken(user, 200, res);
})

exports.protect = catchAsync(async (req, res, next) => {

    // Check token if exists or not
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt       
    }

    if(!token){
        return next(new AppError('You are not logged in. Log in to access.', 401));
    }
    //Verify Token
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //Check if user still exists
    const currentUser = await User.findById(decodedToken.id);
    if(!currentUser){
        return next(new AppError('The user who held the token no longer exists!', 401));
    }
    // Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decodedToken.iat)){
        return next(new AppError('User recently changed the password! Please login again'))
    }

    // Grant Access to protected routes
    req.user = currentUser;  //******* IMP step
    res.locals.user = currentUser;
    next();
})

// Only for rendered pages there will be no error
exports.isLoggedIn = async (req, res, next) => {
    
    if(req.cookies.jwt){
        try{
            // 1] Verify Token
            const decodedToken = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            
            // 2] Check if user still exists
            const currentUser = await User.findById(decodedToken.id);
            if(!currentUser){
                return next();
            }
            // 3] Check if user changed password after the token was issued
            if(currentUser.changedPasswordAfter(decodedToken.iat)){
                return next();
            }
            
            // There is a logged in user
            res.locals.user = currentUser;
            return next();
        }catch(err){
            return next(); 
        }
    }
    next();
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ status: "success" });
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError("You don't have permission to perform this action", 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1] Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if(!user){
        return next(new AppError('There is no user with that email address!', 404));
    }

    // 2] Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3] Send it to users email
    try{
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        await new Email(user, resetUrl).sendPasswordReset()

        res.status(200).json({
            status: "success",
            message: "Token sent to Email"
        })
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiresAt = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending mail. Try again later!', 500))
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1] Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiresAt: { $gt: Date.now() }
    });

    // 2] If token has not expired, and there is a user, reset the password
    if(!user){
        return next(new AppError('Token is invalid or has expired!', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;

    await user.save();
    
    // 3] Update changePasswordAt property for user
    // Done in userModel

    // 4] Log the user in and send JWT 
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1] Get user in collection
    const user = await User.findById(req.user.id).select('+password');

    // 2] Check if POSTed password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError('Password doesnt match', 401));

    // 3] If yes, change password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4] Log user in, send JWT
    createSendToken(user, 200, res);
});