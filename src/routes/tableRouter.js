/**
 * Table router: this router is for serving the requests for tables operations such as book table,
 * new table,...
 */
import express from 'express'
import * as tableControllers from '../Controllers/table.controller.js'
import SessionController from '../Middewares/SessionController.js'
const tableRouter = express.Router()

/**  Cafe manager want to create a new table in cafe */
tableRouter.post('/new', SessionController.authManagerToken, tableControllers.newTableController)

/** A Customer want to book this table */
tableRouter.post('/booktable', tableControllers.bookTableController)

/** Waiter want to clean the table */
tableRouter.patch('/clean/:tableId', SessionController.authManagerToken, tableControllers.cleanTableController)

/** Waiter or customer want to view the bill of the table */
tableRouter.get('/bill', SessionController.authCustomerToken, tableControllers.getTableBillController)

/** Fetch all tables with its orders */
tableRouter.get('/tablesDetails', SessionController.authManagerToken, tableControllers.fetchTablesWithOrdersController)

export { tableRouter }