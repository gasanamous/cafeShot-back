import ErrorHandler from '../utils/services/ErrorHandler.js'
import { StatusCodes } from 'http-status-codes'
import { ManagerModel } from '../models/Manager.js'
import AppError from '../utils/services/AppError.js'
import SessionController from '../Middewares/SessionController.js'
import bcrypt from 'bcrypt'
import { MANAGER_STATUS } from '../utils/enums.js'

const loginController = async (req, res) => {

    try {
        const { loginId, accountPassword } = req.body

        /** check if the email and password are provided in the request body */
        if (!loginId || !accountPassword) {
            throw new AppError(
                'InvalidDataStrucureError',
                'Please enter email/ID and password',
                StatusCodes.BAD_REQUEST
            )
        }

        /** check if the email is valid (CASE SENSITIVE for ID) */
        const manager = await ManagerModel.findOne({ accountEmail: loginId }) || await ManagerModel.findOne({ _id: loginId })

        if (!manager) {
            throw new AppError('NotFoundError', 'Invalid email or password', StatusCodes.NOT_FOUND)
        }

        /** check if the password is valid using "bcrypt" lib */
        const isPasswordValid = await bcrypt.compare(accountPassword, manager.accountPassword)
        if (!isPasswordValid) {
            throw new AppError(
                'NotFoundError',
                'Invalid email or password',
                StatusCodes.UNAUTHORIZED
            )
        }

        /** Manager is valid and login success => generate access token */
        const ACCESS_TOKEN = SessionController.createToken({
            managerId: manager._id,
            role: manager.role
        }, "1h")

        /** Generate refresh access token to store it in clients cookies (expired after 1 month) */
        const REFRESH_ACCESS_TOKEN = SessionController.createToken({}, "30d")
        res.cookie("refreshToken", REFRESH_ACCESS_TOKEN, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.status(StatusCodes.OK).send({
            message: "Logged in successfully",
            ACCESS_TOKEN,
            role: manager.role,
            managerId: manager._id,
            fullName: `${manager.firstName} ${manager.lastName}`
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const addNewManagerController = async (req, res) => {

    try {

        const { ...newManager } = req.body

        /** Check if body contains newManager object   */
        if (!newManager || !newManager.accountEmail) {
            throw new AppError(
                "RequsetWithoutDataError",
                "Please enter the data of the new manager",
                StatusCodes.BAD_REQUEST
            )
        }

        /** Check existence */
        const existingManager = await ManagerModel.findOne({
            $or: [
                { accountEmail: newManager.accountEmail },
                { phoneNumber: newManager.phoneNumber }
            ]
        })

        if (existingManager) {
            throw new AppError(
                "DuplicateDataError",
                "This manager email or phone number already exists",
                StatusCodes.CONFLICT
            )
        }

        /** Give a temporary ID to the manager */
        newManager._id = "n"
        /** Try to insert new document into Manager model */
        const inserted = await ManagerModel.insertOne(newManager)

        /** Manager inserted successfully */
        res.status(StatusCodes.CREATED).send({
            newManager: inserted
        })

    } catch (error) {

        if (error.name === 'ValidationError') {
            delete error.errors["_id"]
        }
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const updateManagerController = async (req, res) => {

    try {

        const { managerId } = req.params
        const { ...newManagerData } = req.body

        /* Check if provided ID is valid to update */
        const manager = await ManagerModel.findById(managerId)

        if (!manager) {
            throw new AppError(
                "NotFoundError",
                "Please provide a valid manager ID",
                StatusCodes.NOT_FOUND
            )
        }

        /** Important if-statement, administrator must not be able to change the waiter password */
        if (newManagerData && newManagerData.accountPassword) {
            delete newManagerData.accountPassword
        }

        /** Update manager data */
        const filter = { _id: managerId }
        const updateOp = { $set: { ...newManagerData } }
        const updateOptions = { runValidators: true, new: false, upsert: false }
        await ManagerModel.updateOne(filter, updateOp, updateOptions)

        return res.status(StatusCodes.OK).send({ message: "Manager updated successfully" })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const deleteManagerController = async (req, res) => {

    try {

        const { managerId } = req.params

        /** Check params existence */
        if (!managerId) {
            throw new AppError(
                "InvalidDataStructureError",
                "Please provide a manager ID to delete",
                StatusCodes.BAD_REQUEST
            )
        }
        /** Check if this is real manage ID */
        const manager = await ManagerModel.findOne({ _id: managerId })

        if (!manager) {
            throw new AppError(
                "NotFoundError",
                "This manager does not exist",
                StatusCodes.NOT_FOUND
            )
        }

        /** Manager is real, delete from database */
        await ManagerModel.deleteOne({ _id: managerId })
        return res.status(StatusCodes.OK).send({
            message: "Manager deleted successfully"
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const restrictManagerController = async (req, res) => {
    try {

        const { managerId } = req.params

        /* Check if provided ID is valid to update */
        const manager = await ManagerModel.findById(managerId)

        if (!manager) {
            throw new AppError(
                "NotFoundError",
                "Please provide a valid manager ID",
                StatusCodes.NOT_FOUND
            )
        }

        /** Update manager status */
        /** if restricted => unrestrict, else restrict */
        const filter = { _id: managerId }
        const updateOp = {
            $set: {
                status:
                    manager.status == MANAGER_STATUS.RESTRICTED ?
                        MANAGER_STATUS.ACTIVE
                        : MANAGER_STATUS.RESTRICTED
            }
        }
        const updateOptions = { runValidators: true, new: false, upsert: false }
        await ManagerModel.updateOne(filter, updateOp, updateOptions)

        return res.status(StatusCodes.OK).send({
            message: `Manager ${manager.status == MANAGER_STATUS.ACTIVE ? 'restricted' : 'unrestricted'
                }`
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const getAllManagersController = async (req, res) => {

    try {

        /** Find all managers */
        const managers = await ManagerModel.find({}, { __v: 0, accountPassword: 0 })

        return res.status(StatusCodes.OK).send({
            managers
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

export {
    loginController,
    addNewManagerController,
    updateManagerController,
    deleteManagerController,
    restrictManagerController,
    getAllManagersController
}