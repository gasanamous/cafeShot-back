/** Menu document in database
 * 
*/
import { mongoose } from "../Database/db_connection.js"
const { Schema } = mongoose
import { capitalizeFirstLetter } from "../utils/services/services.js"

const menuSchema = new Schema({
    itemName: {
        type: String,
        required: [true, "Please enter the item name"],
        set: (itemName) => capitalizeFirstLetter(itemName.trim()),
        id: false
    },
    description: {
        type: String,
        required: false,
        default: null,
        set: (description) => capitalizeFirstLetter(description.trim()),
    },
    possibleDecorations: {
        required: false,
        type: [String]
    },
    itemImage: {
        type: String,
        required: false,
        default: "coffe.png"
    },
    series: {
        type: String,
        enum: {
            values: [
                "Drink",
                "Other",
                "Food",
                "Dessert"
            ],
            message: "{VALUE}! Please enter a valid series name"
        },
        set: (seriesName) => capitalizeFirstLetter(seriesName.trim()),
        required: [true, "What is the series of this item?"],

    },
    category: {
        type: String,
        required: [true, "What is the category of this item?"],
        enum: {
            values: [
                "Hot drink",
                "Iced drink",
                "Food",
                "Western dessert",
                "Eastern dessert"
            ],
            message: "{VALUE}! Please enter a valid category"
        },
        set: (category) => capitalizeFirstLetter(category.trim())
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
    howManyOrdered: {
        type: Number,
        required: false,
        default: 0,
        validate: {
            validator: (howMany) => howMany >= 0,
            message: 'Number of times this item ordered cannot be a negative number'
        },
        default: 0
    },
    addedAt: {
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
menuSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.updatedAt = Date.now()
    }
    next()
})

//menuSchema.plugin(mongooseUniqueValidator, { message: "Item '{VALUE}' is already exist!" })
const MenuModel = mongoose.model('MenuModel', menuSchema)

export { MenuModel }