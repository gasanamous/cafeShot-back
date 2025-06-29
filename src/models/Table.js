/**
 * TableModel: This model (document) is for storing table states, orders and others 
 */
import { mongoose } from "../Database/db_connection.js";
import { capitalizeFirstLetter } from "../utils/services/services.js";
const Schema = mongoose.Schema
import { TABLE_STATUS } from '../utils/enums.js'

const tableSchema = new Schema({
    _id: {
        type: String,
        required: [true, "Please enter the id for the new table"],
        set: (_id) => _id.toString().trim().toLowerCase(),
    },
    status: {
        type: String,
        default: TABLE_STATUS.AVAILABLE,
        enum: Object.values(TABLE_STATUS),
        set: newTableStatus => capitalizeFirstLetter(newTableStatus).trim()
    },
    floor: {
        type: Number,
        default: 0,
        validate: {
            validator: newTableFloor => newTableFloor >= 0,
            message: "Please type a valid floor number for the new table"
        }
    },
    addedAt: {
        type: Date,
        default: () => Date.now(),
        get: (date) => `(${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`
    },
    updatedAt: {
        type: Date,
        default: null,
        get: (date) => `(${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`

    }
})
tableSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret.id
        return ret
    }
})

tableSchema.virtual('tableId').get(function () {
    return this._id
})
const TableModel = mongoose.model('TableModel', tableSchema)

export { TableModel }