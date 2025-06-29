import { ContactsModel } from "../models/Contacts.js";
import { StatusCodes } from "http-status-codes";
import AppError from "../utils/services/AppError.js";
import ErrorHandler from "../utils/services/ErrorHandler.js";
import { getManagersLoggedIn } from "../socket/managerConnection.js";
import { io } from "../../server.js";

const makeContactController = async (req, res) => {

    try {

        const { email, message } = req.body

        /** Check if body contains contact information */
        if (!email || !message) {
            throw new AppError(
                'RequsetWithoutDataError',
                'Please provide contact information and message',
                StatusCodes.BAD_REQUEST
            )
        }

        /** Insert into database */
        await ContactsModel.insertOne(req.body)

        return res.status(StatusCodes.ACCEPTED).send({
            message: "Your message submitted successfully"
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const fetchAllContacts = async (req, res) => {

    try {

        const contacts = await ContactsModel.find({})

        return res.status(StatusCodes.OK).send({
            contacts
        })
    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const callWaiter = async (req, res) => {

    const { tableId } = req.params

    try {
        const onlineWaiters = Object.values(getManagersLoggedIn())

        for (let socketId of onlineWaiters) {
            io.to(socketId).emit('callWaiter', `Calling from ${tableId}`)
        }

        return res.status(StatusCodes.OK).send({})
    } catch (error) {
        console.log(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            errMsg: "Error while calling a waiter"
        })
    }
}
export {
    makeContactController,
    fetchAllContacts,
    callWaiter
}