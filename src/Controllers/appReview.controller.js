import ErrorHandler from "../utils/services/ErrorHandler.js";
import { AppReviewModel } from "../models/AppReview.js";
import { StatusCodes } from 'http-status-codes'
import AppError from "../utils/services/AppError.js";

const newRatingController = async (req, res) => {

    try {

        if (!req.body.rating) {
            throw new AppError("RequsetWithoutDataError", "Please provide a rating", StatusCodes.BAD_REQUEST)
        }

        if (req.body.rating < 1 || req.body.rating > 5) {
            throw new AppError("InvalidDataStrucureError", "Please provide a rating between 0 and 5", StatusCodes.BAD_REQUEST)
        }
        const newReview = await AppReviewModel.insertOne(req.body)

        return res.status(StatusCodes.CREATED).send({
            message: "Thank you for rating us"
        })
    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const getTopReview = async (req, res) => {

    try {

        /** Default  */
        const { limit = 5 } = req.query

        const topReviews = await AppReviewModel.find(
            { rating: { $gte: limit }, comment: { $ne: null } }
        ).select("-_id -__v")
        return res.status(StatusCodes.OK).send({ topReviews })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}
export {
    newRatingController,
    getTopReview
}
