/**
 * Session router: for serving the requests for session operations
 */
import express from 'express'
import SessionController from '../Middewares/SessionController.js'
const sessionRouter = express.Router()

/** Refresh session token */
sessionRouter.post('/refresh', SessionController.refreshToken)

export { sessionRouter }