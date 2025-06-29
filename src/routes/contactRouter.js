import express from 'express'
const contactRouter = express.Router()
import * as contactcontrollers from '../Controllers/contact.controller.js'
import SessionController from '../Middewares/SessionController.js'

/** User want to make a contact  */
contactRouter.post('/new', contactcontrollers.makeContactController)

/** Get all contacts */
contactRouter.get('/', SessionController.authManagerToken, contactcontrollers.fetchAllContacts)

/** call waiter */
contactRouter.post('/call-waiter/:tableId', contactcontrollers.callWaiter)
export { contactRouter }