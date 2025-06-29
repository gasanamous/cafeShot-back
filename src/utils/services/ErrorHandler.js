/**
 * To avoid complex code, this class has a static method for handling errors and return the data of errors
 * including errorName, errorFields (if the error caused by invalid input from user ), and helpful-understood
 * error details
 */
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import AppError from './AppError.js';

class ErrorHandler {

    // Custom errors names array
    static #customErrors = ["HeaderWithoutTokenError", "RequsetWithoutDataError", "InvalidDataStrucureError", "NotFoundError", "DuplicateDataError", "InvalidProcessError",]
    static #sessionErrors = ["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"]

    static handle(error, config) {
        if (error.name === "ValidationError") {

            const statusCode = StatusCodes.UNPROCESSABLE_ENTITY
            const errorDetails = this.#handelValidationError(error, config)

            error.process === 'updateMenu' ? errorDetails._id = error._id : ""
            return { statusCode, errorDetails }

        }

        else if (error.name === "MongooseError") {

            const statusCode = StatusCodes.BAD_REQUEST
            const errorDetails = this.#handleMongooseError(error)

            return { statusCode, errorDetails }

        }
        else if (error instanceof AppError && this.#customErrors.includes(error.name)) {

            const statusCode = error.errorCode
            const errorDetails = {
                errMsg: error.message
            }
            return { statusCode, errorDetails }

        }
        else if (this.#sessionErrors.includes(error.name)) {

            const statusCode = StatusCodes.UNAUTHORIZED
            const errorDetails = {
                errMsg: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
            }
            return { statusCode, errorDetails }

        }
        else if (error.name === "CastError") {

            const statusCode = StatusCodes.BAD_REQUEST
            let errorDetails = {}
            if (error.path === "_id") {
                errorDetails = {
                    errMsg: `Please provide a valid ${error.modelName} ID`
                }
            }
            else {
                errorDetails = {
                    errMsg: error.message
                }
            }
            return { statusCode, errorDetails }

        }
        else {

            console.log(error)
            const statusCode = StatusCodes.INTERNAL_SERVER_ERROR
            const errorDetails = {
                errMsg: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return { statusCode, errorDetails }
        }
    }

    static #handelValidationError(error, orderItems = []) {

        const fieldsOfErrors = error.errors
        const errorsData = {}
        const structuredErrorsMap = {}

        if (orderItems && orderItems.length > 0) {
            for (let field in fieldsOfErrors) {
                const parts = field.split(".")

                if (parts[0] === "orderItems" && parts.length >= 3) {
                    const index = parseInt(parts[1])
                    const fieldName = parts[2]

                    const itemId = orderItems[index]?.itemId?.toString() || "Unknown"

                    if (!structuredErrorsMap[itemId]) {
                        structuredErrorsMap[itemId] = {
                            itemId: itemId,
                            errors: {}
                        }
                    }

                    const target = structuredErrorsMap[itemId]

                    if (fieldsOfErrors[field].kind === "ObjectId") {
                        target.errors[fieldName] = "Please provide a valid ID"
                    } else {
                        target.errors[fieldName] = fieldsOfErrors[field].message
                    }
                    continue
                }

                if (fieldsOfErrors[field].kind === "ObjectId") {
                    errorsData[field] = "Please provide a valid ID"
                } else {
                    errorsData[field] = fieldsOfErrors[field].message
                }
            }

            return {
                errMsg: "Please enter a correct data",
                errorFields: Object.values(structuredErrorsMap).length > 0
                    ? Object.values(structuredErrorsMap)
                    : errorsData
            }
        }

        for (let field in fieldsOfErrors) {
            const error = fieldsOfErrors[field]

            if (error.name === "CastError") {
                errorsData[field] = `Please enter a valid ${error.path}`
                continue
            }
            errorsData[field] = error.message
        }

        return {
            errMsg: "Please enter a correct data",
            errorFields: errorsData
        }
    }

    static #handleMongooseError(error) {
        return {
            errMsg: error.message
        }
    }

}

export default ErrorHandler