/**
 * Token Controller is responsible for creating, verifying and decoding JWT tokens.
 * It also handles authentication for different roles such as table, manager and order.
 */
import { StatusCodes } from 'http-status-codes';
import { nanoid } from 'nanoid'
import { TableSessionModel } from '../models/TableSession.js';
import AppError from '../utils/services/AppError.js';
import ErrorHandler from '../utils/services/ErrorHandler.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { TableModel } from '../models/Table.js';
import { ManagerModel } from '../models/Manager.js'

dotenv.config()

class SessionController {

    static #JWT_KEY = process.env.JWT_KEY
    static #JWT_REFRESH_KEY = process.env.JWT_REFRESH_KEY
    static #ADMIN_PATHS = [
        "/manager/new",
        "/manager/update",
        "/manager/restrict",
        "/manager/delete",
        "/manager/systeminfo",
        "/menu/new",
        "/menu/update",
        "/menu/delete",
        "/order/allorders",
        "table/new"
    ]
    static #ACCESS_DENIED_MSG = "Access Denied. You are not allowed to do this process"

    static createTableSession(tableId) {
        const tableSession = {
            sessionId: nanoid(),
            tableId
        }
        return tableSession
    }

    static createToken(payload, expireTime, forRefresh = false) {

        if (forRefresh) {
            return jwt.sign(payload, this.#JWT_REFRESH_KEY, { expiresIn: expireTime })
        }
        return jwt.sign(payload, this.#JWT_KEY, { expiresIn: expireTime })
    }

    static #verifyToken = (token, forRefresh = false) => {

        if (forRefresh) {
            return jwt.verify(token, this.#JWT_REFRESH_KEY)
        }
        return jwt.verify(token, this.#JWT_KEY)
    }

    static #decodeToken(token) {
        return jwt.decode(token)
    }

    static #isToken = (req) => {

        const authHeader = req.headers.authorization || ""
        const parts = authHeader.split(" ")

        if (parts.length != 2 || parts[0].toLowerCase() !== "bearer") {
            return ""
        }
        return parts[1]
    }

    static async authCustomerToken(req, res, next) {

        try {

            const token = SessionController.#isToken(req)

            /** Verify and decode the token -> throws error if token in invalid */
            const tokenData = SessionController.#verifyToken(token)

            /** Token is valid => check if this token is related to a session */
            const { iat, exp, ...tableSessionData } = tokenData
            const session = await TableSessionModel.findOne(tableSessionData)

            /** if token is valid but no sesssion, then response 401 with mark to not make a refresh token.
             * Also with this flag, its like tell front developer to to remove the token from client storage
            */
            if (!session) {
                return res.status(StatusCodes.UNAUTHORIZED).send({
                    errMsg: "Please book the table to be able to make your order. Use the QR code or key",
                    closeSession: true
                })
            }
            req.tokenData = tokenData
            return next()

        } catch (error) {
            const { statusCode, errorDetails } = ErrorHandler.handle(error)
            return res.status(statusCode).send(errorDetails)
        }

    }

    static async authManagerToken(req, res, next) {
        try {

            const token = SessionController.#isToken(req)

            /** Verify and decode the token -> throws error if token in invalid */
            const tokenData = SessionController.#verifyToken(token)

            /** Token is valid  => check if manager is exist */
            const manager = await ManagerModel.findOne({ _id: tokenData.managerId })

            if (!manager) {
                return res.status(StatusCodes.UNAUTHORIZED).send({
                    errMsg: SessionController.#ACCESS_DENIED_MSG,
                    closeSession: true
                })
            }
            /** Check if this manager role match the ADMIN PATHS */
            if (!SessionController.#isAllowed(req.originalUrl, tokenData.role)) {
                return res.status(StatusCodes.FORBIDDEN).send({
                    errMsg: SessionController.#ACCESS_DENIED_MSG
                })
            }
            req.tokenData = tokenData
            return next()

        } catch (error) {
            const { statusCode, errorDetails } = ErrorHandler.handle(error)
            return res.status(statusCode).send(errorDetails)
        }
    }

    static #isAllowed(path, role) {

        if (role === "Waiter") {
            const isAdminPath = this.#ADMIN_PATHS.find(adminPath => {
                return path.indexOf(adminPath) != -1
            })
            return isAdminPath ? false : true
        }

        return true

    }

    static async refreshToken(req, res) {


        const oldToken = SessionController.#isToken(req)

        try {

            /** Verify the token whether is really expired -> throw error if not */
            SessionController.#verifyToken(oldToken)
            throw new AppError(
                "InvalidProcessError",
                "Token is not expired",
                StatusCodes.FORBIDDEN
            )

        } catch (error) {

            if (error.name === "TokenExpiredError") {

                try {

                    const refreshToken = req.cookies.refreshToken || req.cookies.refreshTableToken

                    /** Verify the refresh token in request cookie */
                    SessionController.#verifyToken(refreshToken, true)

                    /** Pick the payload from the old token */
                    const { iat, exp, ...oldTokenPayload } = SessionController.#decodeToken(oldToken)

                    /** Generate a new token with same payload */
                    const NEW_TOKEN = SessionController.createToken(oldTokenPayload, "1h")

                    /** Send the new token in response */
                    return res.status(StatusCodes.OK).send({ NEW_TOKEN })
                } catch (error) {

                    console.log(error)
                    if (error.name === "TokenExpiredError") {

                        let errMsg = req.cookies.refreshToken ?
                            "Session Expired. Please login again to continue" :
                            "Table session Expired. Please book the table again to continue"

                        return res.status(StatusCodes.UNAUTHORIZED).send({ errMsg })
                    }
                    const { statusCode, errorDetails } = ErrorHandler.handle(error)
                    return res.status(statusCode).send(errorDetails)
                }


            }

            const { statusCode, errorDetails } = ErrorHandler.handle(error)
            return res.status(statusCode).send(errorDetails)
        }
    }

}

export default SessionController;
