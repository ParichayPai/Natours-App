const mongoose = require('mongoose')
const slugify = require('slugify')
// const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        maxlength: [40, 'A tour name must have length less than equal to 40 chars'],
        minlength: [10, 'A tour name must have length more than equal to 10 chars'],
        // validate: [validator.isAlpha, 'Tour name must only contain alphabets']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
      },
    rating: {
        type: Number,
        default: 4.0
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => val.toFixed(1) //Math.round(val * 10) / 10 
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // this only points to current doc on NEW doc creation 
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be less than price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
          values: ['easy', 'medium', 'difficult'],
          message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false // hides this from client
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        location: [
            {
                type: {
                    type: String, 
                    default: 'Point',
                    enum: ["Point"]
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ]
    },
    locations: [
        {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point']
          },
          coordinates: [Number],
          address: String,
          description: String,
          day: Number
        }
      ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// tourSchema.index({price: 1})
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1});
tourSchema.index({ startLocation: '2dsphere' })

// We put this code here since our aim is thin controllers and fat models
// virtuals are basically not app logic but business logic(Think abt it)
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

//The ref option, which tells Mongoose which model to populate documents from.
// The localField and foreignField options. Mongoose will populate documents from 
// the model in ref whose foreignField matches this document's localField.

// Virtual Populate 
tourSchema.virtual('reviews', {
    ref: "Review",
    foreignField: 'tour',
    localField: "_id" 
})

// DOCUMENT MIDDLEWARE: runs b4 .save() and .create() 
tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises); 

//     next();
// })

// 'save' here is called the hook. We can have multiple pre and post middlewares on the same hook

// tourSchema.post('save', function(doc,next){
//     next();
// })

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next){     // Regex so that both find and findone are affected by this pre find hook
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    
    next();
})

tourSchema.post(/^find/, function(docs, next) {
    console.log(`The query took ${Date.now() - this.start} milliseconds`);
    // console.log(docs);
    next();
})


// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//     // console.log(this.pipeline())
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;