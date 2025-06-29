/**
 * Order model: orders in database
 */
import { mongoose } from "../Database/db_connection.js";
import { MenuModel } from "./Menu.js";
import { ORDER_STATUS } from "../utils/enums.js";
const { Schema } = mongoose

const orderSchema = new Schema({

    tableId: {
        type: String,
        ref: 'TableModel',
        required: [true, "Order cannot be accepted without table"],
        set: (_id) => _id.toString().trim().toLowerCase(),
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
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: "Pending"
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    orderedAt: {
        type: Date,
        default: () => Date.now(),
        get: (date) =>
            date
                ? `${new Date(date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })} - ${new Date(date).toLocaleTimeString('en-GB', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })}`
                : ""
    },
    updatedAt: {
        type: Date,
        default: null,
        get: (date) =>
            date
                ? `${new Date(date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })} - ${new Date(date).toLocaleTimeString('en-GB', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })}`
                : ""
    }
})

/** This middleware is used for calculating the price of each item and the total price of the order */
orderSchema.pre('save', async function (next) {

    /** If the order is not new, then we need to update the updatedAt field */
    if (this.totalPrice !== 0) {
        this.updatedAt = Date.now()
    }

    /** Prices: array which each element represent the single price of its corresponds item in orderItems */
    const prices = await Promise.all(
        this.orderItems.map(async (orderItem) => {
            const itemData = await MenuModel.findById(orderItem.itemId)
            /** Increase how many this item ordered */
            itemData.howManyOrdered += orderItem.quantity
            await itemData.save()

            orderItem.price = itemData.costPerUnit * orderItem.quantity
            orderItem.costPerUnit = itemData.costPerUnit
            return orderItem.price

        })
    )
    this.totalPrice = prices.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
    next()

})

/** Users dont know items as ID's. Hence create a fully described item for order */
orderSchema.methods.getOrderAsNamedItems = async function () {

    await this.populate("orderItems.itemId")

    const detailedOrderItems = this.orderItems.map(orderItem => {
        return {
            itemId: orderItem.itemId,
            itemName: orderItem.itemId.itemName,
            quantity: orderItem.quantity,
            decorations: orderItem.decorations,
            description: orderItem.description,
            price: orderItem.price,
            costPerUnit: orderItem.costPerUnit,
        }
    })
    const order = {
        _id: this._id,
        items: detailedOrderItems,
        totalPrice: this.totalPrice,
        orderedAt: this.orderedAt,
        status: this.status
    }
    return order

}

const OrderModel = mongoose.model('OrderModel', orderSchema)

export { OrderModel, orderSchema }