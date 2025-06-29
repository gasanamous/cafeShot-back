/**
 * ArchivedOrders.js
 * This file contains the model for archived orders
 */
import { mongoose } from '../Database/db_connection.js'
const { Schema } = mongoose

const archivedOrderSchema = new Schema({

    tableId: {
        type: String,
        required: [true, "Please provide table ID"],
        ref: 'TableModel'
    },
    orderItems: [{
        _id: false,
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'MenuModel',
            required: [true, "Please select at least one item to be able to make order"],
        },
        quantity: {
            type: Number,
            min: [1, "Item cannot be ordered with quantity of {VALUE} "],
            default: 1,
        },
        costPerUnit: {
            type: Number,
            required: false,
            default: 0,
            validate: {
                validator: (cost) => cost >= 0,
                message: () => `Cost must be positive`
            }
        },
        price: {
            type: Number,
            min: [0, ""],
            default: 0
        },
        decorations: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            default: null,
        }
    }],
    archivedBy: {
        type: String,
        ref: 'ManagerModel',
        required: [true, "Archived order must have a manager ID"]
    },
    archivedAt: {
        type: Date,
        default: () => Date.now(),
        get: (date) => `(${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`
    }
})

const ArchivedOrderModel = mongoose.model('ArchivedOrderModel', archivedOrderSchema)

export { ArchivedOrderModel, archivedOrderSchema }