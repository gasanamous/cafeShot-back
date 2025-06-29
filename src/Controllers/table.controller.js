import ErrorHandler from "../utils/services/ErrorHandler.js";
import AppError from "../utils/services/AppError.js";
import { TableModel } from "../models/Table.js";
import { ArchivedOrderModel } from "../models/ArchivedOrders.js";
import { OrderModel } from "../models/Order.js";
import { StatusCodes } from 'http-status-codes'
import SessionController from "../Middewares/SessionController.js";
import { TABLE_STATUS } from "../utils/enums.js";
import { TableSessionModel } from "../models/TableSession.js";

const newTableController = async (req, res) => {

    try {

        /** To throw a custom error if body is empty*/
        if (!req.body || !req.body.tableId) {
            throw new AppError("RequsetWithoutDataError", "Please enter table ID", StatusCodes.BAD_REQUEST)
        }
        /** To throw a custom error if table ID is not unique*/
        if (await TableModel.findById(req.body.tableId)) {
            throw new AppError("DuplicateDataError", "Table ID must be unique", StatusCodes.CONFLICT)
        }

        const newTableInserted = await TableModel.insertOne({ _id: req.body.tableId, floor: req.body.floor || undefined })

        return res.status(StatusCodes.CREATED).send({
            message: `Table ${newTableInserted._id} inserted successfully`,
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const bookTableController = async (req, res) => {
    try {

        const { tableId } = req.body
        console.log(req.body)

        if (!tableId) {
            throw new AppError('RequsetWithoutDataError', 'Please provide table ID', StatusCodes.BAD_REQUEST)
        }
        // is this table available?
        const table = await TableModel.findById(tableId)

        // if table does not stored in database, this will be 400: bad request
        if (!table) {
            throw new AppError('NotFoundError', 'Table does not exist', StatusCodes.NOT_FOUND)
        }


        if (table.status === TABLE_STATUS.BOOKED) {
            return res.status(StatusCodes.CONFLICT).send({
                errMsg: 'Table is booked. Please book another one.',
            })
        }

        // Update table status into "Booked" and return response as Accepted (202) with token
        table.status = TABLE_STATUS.BOOKED
        await table.save()

        /** Create table session and insert into TableSessionModel */
        const tableSession = SessionController.createTableSession(tableId)
        await TableSessionModel.insertOne({ ...tableSession })

        /**
         * Table is available. 
         * Hence, start a new session by generating JWT token and resend it to client.
         * Token expire date is set initially to "1 hour"
         */
        const TABLE_ACCESS_TOKEN = SessionController.createToken({
            tableId: table._id,
            sessionId: tableSession.sessionId
        }, "1h")

        /** Generate refresh access token to store it in clients cookies (expired after 1 month) */
        const REFRESH_TABLE_ACCESS_TOKEN = SessionController.createToken({}, "30d", true)

        res.cookie("refreshTableToken", REFRESH_TABLE_ACCESS_TOKEN, {
            httpOnly: true,
            secure: true, /** Because it's https in the front end code */
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.status(StatusCodes.CREATED).send({
            message: 'Table booked successfully',
            TABLE_ACCESS_TOKEN
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const cleanTableController = async (req, res) => {
    try {
        const { tableId } = req.params
        const { tokenData } = req

        /** Request does not contains table ID */
        if (!tableId) {
            throw new AppError('RequsetWithoutDataError', 'Please provide table ID', StatusCodes.BAD_REQUEST)
        }
        /** Try to find the table in database */
        const table = await TableModel.findById(tableId)

        /** Table does not exist */
        if (!table) {
            throw new AppError('NotFoundError', 'Table does not exist', StatusCodes.NOT_FOUND)
        }

        /** Check if table is available or already cleaned */
        if (table.status === TABLE_STATUS.AVAILABLE) {
            throw new AppError('InvalidProcessError', 'Table is already cleaned and available to use', StatusCodes.BAD_REQUEST)
        }
        /** Remove table session from TableSessionModel */
        await TableSessionModel.findOneAndDelete({ tableId })

        /** 
         * Table is ready for archiving orders.
         * Hence, find the all orders on this table as a preparing of Archiving
         */
        const tableCurrentOrders = await OrderModel.find({ tableId: table._id })

        /** Archive orders */
        await ArchivedOrderModel.insertMany(
            tableCurrentOrders.map(order => {
                return {
                    orderItems: order.orderItems,
                    archivedBy: tokenData.managerId,
                    tableId: order.tableId,
                }
            })
        )

        /** 
         * Orders archived 
         * Now, delete all orders for this table from OrderModel
        */
        await OrderModel.deleteMany({ tableId: table._id })
        table.status = TABLE_STATUS.AVAILABLE
        await table.save()

        return res.status(StatusCodes.OK).send({
            message: "Table cleaned successfully and ready for use",
        })


    } catch (error) {
        console.log(error)
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const getTableBillController = async (req, res) => {

    try {
        const { tableId } = req.tokenData

        if (!tableId) {
            throw new AppError("RequsetWithoutDataError", "Please provide table ID", StatusCodes.BAD_REQUEST)
        }
        /** Check if the table exists and really has orders */
        const table = await TableModel.findById(tableId)

        if (!table) {
            throw new AppError("NotFoundError", "Table does not exist", StatusCodes.NOT_FOUND)
        }
        /** Table exist => is table has orders? */
        if (table.status === TABLE_STATUS.AVAILABLE) {
            throw new AppError("InvalidProcessError", "Invalid proccess, table does not has orders", StatusCodes.BAD_REQUEST)
        }

        /** Table is really has orders => get the orders */
        let orders = await OrderModel.find({ tableId })
        orders = await Promise.all(
            orders.map(order => order.getOrderAsNamedItems())
        )
        return res.status(StatusCodes.OK).send({ orders })
    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const fetchTablesWithOrdersController = async (req, res) => {

    try {

        const tablesWithOrders = await TableModel.aggregate([
            {
                $lookup: {
                    from: "ordermodels",
                    localField: "_id",
                    foreignField: "tableId",
                    as: "orders"
                }
            },
            {
                $unwind: {
                    path: "$orders",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$orders.orderItems",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "menumodels",
                    localField: "orders.orderItems.itemId",
                    foreignField: "_id",
                    as: "orders.orderItems.itemDetails"
                }
            },
            {
                $unwind: {
                    path: "$orders.orderItems.itemDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        tableId: "$_id",
                        orderId: "$orders._id"
                    },
                    tableStatus: { $first: "$status" },
                    floor: { $first: "$floor" },
                    orderStatus: { $first: "$orders.status" },
                    orderedAt: { $first: "$orders.orderedAt" },
                    orderUpdatedAt: { $first: "$orders.updatedAt" },
                    totalPrice: { $first: "$orders.totalPrice" },
                    items: {
                        $push: {
                            itemId: "$orders.orderItems.itemId",
                            itemName: "$orders.orderItems.itemDetails.itemName",
                            itemImage: "$orders.orderItems.itemDetails.itemImage",
                            quantity: "$orders.orderItems.quantity",
                            costPerUnit: "$orders.orderItems.costPerUnit",
                            price: "$orders.orderItems.price",
                            decorations: "$orders.orderItems.decorations",
                            description: "$orders.orderItems.description"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.tableId",
                    status: { $first: "$tableStatus" },
                    floor: { $first: "$floor" },
                    orders: {
                        $push: {
                            _id: "$_id.orderId",
                            status: "$orderStatus",
                            orderedAt: "$orderedAt",
                            updatedAt: "$orderUpdatedAt",
                            totalPrice: "$totalPrice",
                            orderItems: "$items"
                        }
                    }
                }
            },
            {
                $addFields: {
                    orders: {
                        $filter: {
                            input: "$orders",
                            as: "order",
                            cond: { $ne: ["$$order.status", null] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    floor: 1,
                    orders: 1
                }
            }
        ])

        res.status(StatusCodes.OK).send({ tablesWithOrders })
    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

export {
    newTableController,
    bookTableController,
    cleanTableController,
    getTableBillController,
    fetchTablesWithOrdersController
}