const AppError = require("../utils/appError")

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue.name; //err.errmsg.match(/"(.*?)"/);
    const message = `Duplicate field value "${value}". Please use another value.`
    return new AppError(message,400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(ele => ele.message);
    const message = `Invalid Input data. ${errors.join('. ')}`
    return new AppError(message, 400);
}

const sendErrDev = (err, req, res) => {
    // API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            // name: err.name,
            message: err.message,
            stack: err.stack
        });
    } 
    // Rendered website  
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong...',
        msg: err.message
    })
}

const sendErrProd = (err, req, res) => {
    //API
    if(req.originalUrl.startsWith('/api')){     
        if(err.isOperational){ // Operational, trusted error: send message to client
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }  
        //Programming or unknown error, dont send detials to client
        // 1] Log the error
        console.error("ERROR!!", err);
        // 2] Send Generic msg
        return res.status(500).json({
            status: "error",
            message: "Something went wrong!"
        })
    }
    // Rendered Website
    if(err.isOperational){ // Operational, trusted error: send message to client
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong...',
            msg: err.message
        })
    }
    //Programming or unknown error, dont send detials to client
    // 1] Log the error
    console.error("ERROR!!", err);
    // 2] Send Generic msg
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong...',
        msg: 'Please Try Again Later'
    })
}
 
const handleJWTError = () => new AppError("Invalid Token. Please login again", 401);

const handleJWTExpired = () => new AppError("Token Expired!. Login again.", 401)

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrDev(err, req, res);
    }else if(process.env.NODE_ENV === 'production'){
        let error = { ...err };
        error.message = err.message;
        // console.log(err);
        // console.log('//////////////////////////////')
        // console.log(error);
///////////////////////////////////////////////

        // if(err.name === 'CastError'){
        //     err = handleCastErrorDB(err);
        // }
        // if(err.code === 11000){
        //     err = handleDuplicateFieldsDB(err);
        // }
        // if(err.name === 'ValidationError'){
        //     err = handleValidationErrorDB(err);
        // }
        // if(err.name === 'JsonWebTokenError'){
        //     err = handleJWTError();
        // }
        // if(err.name === 'TokenExpiredError'){
        //     err = handleJWTExpired(); 
        // }

////////////////////////////////////////
        if(err.name === 'CastError'){
            error = handleCastErrorDB(error);
        }
        if(err.code === 11000){
            error = handleDuplicateFieldsDB(error);
        }
        if(err.name === 'ValidationError'){
            error = handleValidationErrorDB(err);
        }
        if(err.name === 'JsonWebTokenError'){
            error = handleJWTError();
        }
        if(err.name === 'TokenExpiredError'){
            error = handleJWTExpired(); 
        }

        sendErrProd(err, req, res);
    }
}