import { mongoose } from "../Database/db_connection.js";
import { Schema } from "mongoose";

const appReviewSchema = new Schema({
    rating: {
        type: Number,
        required: [true, "Sorry, you cannot rate without selecting your satisfaction rate with the application"],
        validate: {
            validator: (rating) => rating <= 5,
            message: "You can rate just between 0 and 5"
        }
    },
    comment: {
        type: String,
        required: false,
        default: null
    },
    ratedAt: {
        type: Date,
        required: false,
        default: () => Date.now(),
        get: (date) => {
            const options = { day: 'numeric', month: 'short', year: 'numeric' }
            return `(${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`
        }
    }
})

const AppReviewModel = mongoose.model('AppReview', appReviewSchema)

export { AppReviewModel }
