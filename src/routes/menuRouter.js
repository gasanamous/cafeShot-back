/**
 * Menu router: this router is for handling and serving requests CRUD operations on the menu
 */
import express from 'express'
import * as menuControllers from '../Controllers/menu.controller.js'
import SessionController from '../Middewares/SessionController.js'
import filesController from '../Middewares/filesController.js'

const menuRouter = express.Router()

// Cafe manager want to add a new item to cafe menu
menuRouter.post('/new', SessionController.authManagerToken, filesController.single('itemImage'), menuControllers.newMenuItemController)

// Customer want to view the cafe menu? or to search for a specific produnt? Use this API
menuRouter.get('/', menuControllers.getMenuController)

// Manager want to update one or more menu item
menuRouter.patch('/update/:itemId', SessionController.authManagerToken, filesController.single('itemImage'), menuControllers.updateMenuItemsController)

// Manager want to delete one or more menu item
menuRouter.delete('/delete/:itemId', menuControllers.deleteMenuItemController)

export { menuRouter }