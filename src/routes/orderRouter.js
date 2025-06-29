/**
 * Order router: this router is for handling and serving customers orders
 */
import express from 'express'
const orderRouter = express.Router()
import * as orderContollers from '../Controllers/order.controller.js'
import SessionController from '../Middewares/SessionController.js'

// Customer want to make order 
orderRouter.post('/new', SessionController.authCustomerToken, orderContollers.makeOrderController)

// Customer want to cancel order
orderRouter.delete('/cancel/:orderId', SessionController.authCustomerToken, orderContollers.cancelOrderController)

// Customer want to edit order
orderRouter.patch('/edit/:orderId', SessionController.authCustomerToken, orderContollers.editOrderController)

// Manager want to make a progress for the order (Pending -> in preparing)
orderRouter.patch('/status/:orderId', SessionController.authManagerToken, orderContollers.editOrderStatusController)

/** Fetch all orders API, active and archieved once */
orderRouter.get('/allorders', SessionController.authManagerToken, orderContollers.getAllOrdersController)
export { orderRouter }