const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const reviewSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Concert',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        required: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

reviewSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);