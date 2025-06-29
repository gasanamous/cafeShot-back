import { OrderModel } from "../models/Order.js";
import AppError from "../utils/services/AppError.js";
import ErrorHandler from "../utils/services/ErrorHandler.js";
import { StatusCodes } from 'http-status-codes'
import { ORDER_STATUS } from "../utils/enums.js";
import { io } from "../../server.js";
import { getManagersLoggedIn } from "../socket/managerConnection.js";
import { sendOrderNotification } from "../socket/socket.js";

const makeOrderController = async (req, res) => {
    try {
        const { orderItems } = req.body
        const { tableId } = req.tokenData

        /** To throw a custom error if body is empty */
        if (!orderItems) {
            throw new AppError("RequsetWithoutDataError", "Please provide a list of order items to make your order", StatusCodes.BAD_REQUEST)
        }
        if (!Array.isArray(orderItems) || Array.isArray(orderItems) && orderItems.length === 0) {
            throw new AppError("RequsetWithoutDataError", "Please provide a list of order items to make your order", StatusCodes.BAD_REQUEST)
        }

        /** Try to insert order */
        const newOrder = await OrderModel.insertOne({ tableId, orderItems })

        /** Create fully described order response */
        const orderDetails = await newOrder.getOrderAsNamedItems()

        /** Send a notification to waiters */
        sendOrderNotification(orderDetails)

        return res.status(StatusCodes.CREATED).send({
            message: "Your order has been successfully received. Please allow a short time. Thank you for your patience",
            orderDetails
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error, req.body.orderItems)
        return res.status(statusCode).send(errorDetails)
    }
}

const cancelOrderController = async (req, res) => {
    try {
        const { orderId } = req.params
        const { tableId } = req.tokenData

        /** Check if the order exists */
        const order = await OrderModel.findOne({ _id: orderId, tableId })
        if (!order) {
            throw new AppError("NotFoundError", "Order not found", StatusCodes.NOT_FOUND)
        }

        /** Check if the order is already cancelled (extra step) */
        if (order.status === ORDER_STATUS.CANCELED) {
            throw new AppError("InvalidProcessError", "Order already cancelled", StatusCodes.BAD_REQUEST)
        }
        /** Check if the order is not pending */
        if (order.status !== ORDER_STATUS.PENDING) {
            throw new AppError("InvalidProcessError", "Sorry! Order is in prepraing, it cannot be cancelled", StatusCodes.BAD_REQUEST)
        }

        /* At this point, change the order status to "Cancelled" and the waiter will clean all the orders on this table */
        order.status = ORDER_STATUS.CANCELED
        await order.save()

        /** Create fully described order response */
        const orderDetails = await order.getOrderAsNamedItems()

        return res.status(StatusCodes.OK).send({
            message: "Your order has been successfully cancelled",
            orderDetails
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const editOrderController = async (req, res) => {

    try {
        const { orderId } = req.params
        const { tableId } = req.tokenData
        const { orderItems } = req.body

        /** Check if the order exists */
        const order = await OrderModel.findOne({ _id: orderId, tableId })

        if (!order) {
            throw new AppError("NotFoundError", "Order not found", StatusCodes.NOT_FOUND)
        }
        /** Check if the order is already cancelled */
        if (order.status === ORDER_STATUS.CANCELED) {
            throw new AppError("InvalidProcessError", "Order already cancelled", StatusCodes.BAD_REQUEST)
        }
        /** Check if the order is not pending */
        if (order.status !== ORDER_STATUS.PENDING) {
            throw new AppError("InvalidProcessError", "Sorry! Order is in prepraing, it cannot be edited", StatusCodes.BAD_REQUEST)
        }

        order.orderItems = orderItems
        await order.save()

        /** Create fully described order response */
        const orderDetails = await order.getOrderAsNamedItems()

        return res.status(StatusCodes.OK).send({
            message: "Your order has been successfully Edited. Please allow a short time. Thank you for your patience",
            orderDetails
        })


    } catch (error) {
        if (error.name === "CastError") { error.modelName = "order" }
        const { statusCode, errorDetails } = ErrorHandler.handle(error, req.body.orderItems)
        return res.status(statusCode).send(errorDetails)
    }
}

const editOrderStatusController = async (req, res) => {

    try {
        const { orderId } = req.params
        const { newOrderStatus } = req.body

        /** Check if request contain the new status */

        if (!newOrderStatus) {
            throw new AppError(
                "InvalidDataStrucureError",
                "Please provide a new status of the order to complete the process",
                StatusCodes.BAD_REQUEST
            )
        }

        /** Check if the order exists */
        const order = await OrderModel.findOne({ _id: orderId })

        if (!order) {
            throw new AppError(
                "NotFoundError",
                "Order not found, please provide a valid order ID",
                StatusCodes.NOT_FOUND
            )
        }
        /** Check if the order is already cancelled */
        if (order.status === newOrderStatus) {
            throw new AppError(
                "DuplicateDataError",
                `Order already is ${newOrderStatus}`,
                StatusCodes.BAD_REQUEST
            )
        }

        order.status = newOrderStatus
        await order.save()

        return res.status(StatusCodes.OK).send({
            message: `Order status changed to ${newOrderStatus}`
        })


    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error, req.body.orderItems)
        return res.status(statusCode).send(errorDetails)
    }
}

const getAllOrdersController = async (req, res) => {
    console.log(req.originalUrl)
    try {
        /** Find all active orders */
        let activeOrders = await OrderModel.find({})

        /** Find all completed and archived orders */
        let archievedOrders = await ArchivedOrderModel.find({})

        /** By this point, these two types of orders does not contains a enough details */
        activeOrders = await Promise.all(
            activeOrders.map(order => order.getOrderAsNamedItems())
        )

        archievedOrders = await Promise.all(
            archievedOrders.map(order => order.getOrderAsNamedItems())
        )

        /** Now all orders objects contains the whole details -> response it to client */
        return res.status(StatusCodes.OK).send({ activeOrders, archievedOrders })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}
export {
    makeOrderController,
    cancelOrderController,
    editOrderController,
    editOrderStatusController,
    getAllOrdersController
}