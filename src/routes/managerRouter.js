/**
 * This file contains the routes for the manager operations
 * 
 */
import express from 'express'
import * as managerController from '../Controllers/manager.controller.js'
import SessionController from '../Middewares/SessionController.js'

const managerRouter = express.Router()

/** Manager want to login to his account */
managerRouter.post('/login', managerController.loginController)

/** Administrator want to add a new manager  */
managerRouter.post('/new', SessionController.authManagerToken, managerController.addNewManagerController)

/** Edit manager data */
managerRouter.patch('/update/:managerId', SessionController.authManagerToken, managerController.updateManagerController)

/** Restrict manager */
managerRouter.patch('/restrict/:managerId', SessionController.authManagerToken, managerController.restrictManagerController)

/** Delete manager  */
managerRouter.delete('/delete/:managerId', SessionController.authManagerToken, managerController.deleteManagerController)

/** Fetch all managers categorized by status */
managerRouter.get('/allmanagers', SessionController.authManagerToken, managerController.getAllManagersController)
export { managerRouter }