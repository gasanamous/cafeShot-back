/**
 * Table session model: for managing sessions between tables and customers
 */
import { mongoose } from "../Database/db_connection.js";
const { Schema } = mongoose

const tableSessionSchema = new Schema({

    sessionId: String,
    tableId: {
        type: String,
        ref: 'Tablemodel'
    },
    bookedAt: {
        type: Date,
        default: Date.now
    }
})

const TableSessionModel = mongoose.model('TableSessionModel', tableSessionSchema)

export { TableSessionModel }