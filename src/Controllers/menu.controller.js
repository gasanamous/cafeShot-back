import ErrorHandler from "../utils/services/ErrorHandler.js";
import AppError from "../utils/services/AppError.js";
import { MenuModel } from "../models/Menu.js";
import { StatusCodes } from 'http-status-codes'
import fs from 'fs'
import path from "path";
import { mongoose } from "../Database/db_connection.js";

const newMenuItemController = async (req, res) => {

    try {

        const { ...newItemData } = req.body
        /** Try to insert the item to database */
        await MenuModel.insertOne(
            {
                ...newItemData,
                itemImage: `${newItemData.itemName.toLowerCase()}-${newItemData.description || "no description"}.png`
            }
        )

        /** Item inserted succesfully, save the item image as png */
        const file = req.file
        const filePath = path.resolve(`src/utils/png/${newItemData.itemName.toLowerCase()}-${newItemData.description || "no description"}.png`)

        fs.writeFileSync(filePath, file.buffer)

        /** Item and it's file successfully accepted and created */
        return res.status(StatusCodes.CREATED).send({
            message: "Item added to menu successfully"
        })

    } catch (error) {
        console.log(error)
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const getMenuController = async (req, res) => {
    try {

        const searchQuery = req.query
        const menuItems = await MenuModel.find(searchQuery).select('-__v')

        return res.status(StatusCodes.OK).send({
            message: menuItems.length != 0 ? "Here is the menu" : "Sorry, there are no results for this search",
            menu: menuItems,
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const updateMenuItemsController = async (req, res) => {

    try {

        const { itemId } = req.params
        const { ...newItemData } = req.body

        /** check if the itemId is valid is exist in the URL params */
        if (!itemId) {
            throw new AppError('InvalidDataStrucureError', 'Please provide menu item ID to update', StatusCodes.BAD_REQUEST)
        }

        /** Check if valid item id, to avoid goes in cast error */
        if (!mongoose.isValidObjectId(itemId)) {
            throw new AppError(
                'InvalidDataStrucureError',
                'Please provide a valid item ID',
                StatusCodes.BAD_REQUEST
            )
        }

        /** check if the item exist in database */
        let menuItem = await MenuModel.findOne({ _id: itemId })
        if (!menuItem) {
            throw new AppError(
                'NoDocumentsError',
                'No item found with this ID',
                StatusCodes.NOT_FOUND
            )
        }

        /** check if the newItem is valid is exist in the request body */
        if (!newItemData) {
            throw new AppError(
                'InvalidDataStrucureError',
                'Please provide new item data to update',
                StatusCodes.BAD_REQUEST
            )
        }

        /** Three scenarios: 
         * 1. New name and new image, then remove the old file and save a new file with new name and buffer
         * 2. New image with same name, then override the file with a new buffer
         * 3. New name with same image, then rename the file with the new name
         */

        if (req.file && newItemData.itemName) {

            /** New name and new image */

            /** Remove the old file  */
            const oldFilePath = path.resolve(`src/utils/png/${menuItem.itemImage}`)
            fs.rmSync(oldFilePath, { force: true })

            /** Save a new file with new name and buffer */
            const newFileName = `${newItemData.itemName.toLowerCase()}-${newItemData.description || menuItem.description}.png`
            const newFilePath = path.resolve(`src/utils/png/${newFileName}`)
            fs.writeFileSync(newFilePath, req.file.buffer)

            /** update itemImage in DB */
            menuItem.itemImage = newFileName

        } else if (req.file && !newItemData.itemName) {

            /** New image with same name */

            /** Override the file with a new buffer */
            const filePath = path.resolve(`src/utils/png/${menuItem.itemImage}`)
            fs.writeFileSync(filePath, req.file.buffer)

        } else if (!req.file && newItemData.itemName) {

            /** New name with same image */
            /** Rename the file with the new name */
            const filePath = path.resolve(`src/utils/png/${menuItem.itemImage}`)
            const newFileName = `${newItemData.itemName.toLowerCase()}-${newItemData.description || menuItem.description}.png`
            fs.renameSync(filePath, path.resolve(`src/utils/png/${newFileName}`))

            menuItem.itemImage = newFileName
        }


        /** update other item data */
        for (let key in newItemData) {

            /** Skip _id to avoiding cast error */
            if (key === '_id' || key == 'itemImage') {
                continue
            }
            menuItem[key] = newItemData[key]
        }

        await menuItem.save()
        return res.status(StatusCodes.OK).send({
            messsage: "Item updated successfully",
            item: menuItem
        })

    } catch (error) {
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}

const deleteMenuItemController = async (req, res) => {

    try {

        const { itemId } = req.params
        console.log(itemId)
        /** Check if item ID exists in URL */
        if (!itemId) {
            throw new AppError(
                'InvalidDataStrucureError',
                'Please provide menu item ID to delete',
                StatusCodes.BAD_REQUEST
            )
        }

        const item = await MenuModel.findOne({ _id: itemId })
        if (!item) {
            throw new AppError(
                'NotFoundError',
                'No menu item found with this ID',
                StatusCodes.NOT_FOUND
            )
        }
        await MenuModel.findByIdAndDelete(itemId)
        /** Remove image  */
        const oldFilePath = path.resolve(`src/utils/png/${item.itemImage}`)
        fs.rmSync(oldFilePath, { force: true })

        return res.status(StatusCodes.OK).send({
            message: "Item deleted successfully",
        })
    } catch (error) {
        console.log(error)
        const { statusCode, errorDetails } = ErrorHandler.handle(error)
        return res.status(statusCode).send(errorDetails)
    }
}



export {
    newMenuItemController,
    getMenuController,
    updateMenuItemsController,
    deleteMenuItemController
}