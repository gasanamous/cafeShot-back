/**
 * Contacts Model: a model for storing "call us" things
 */
import { mongoose } from "../Database/db_connection.js";
const { Schema } = mongoose

const contactsSchema = new Schema({

    email: {
        type: String,
        validate: {
            validator: email => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
            message: "Invalid email. Please use a valid format for your email address"
        },
        set: email => email.trim().toLowerCase()
    },
    message: {
        type: String,
        required: [true, "Please provide message"]
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
})

const ContactsModel = mongoose.model('ContactsModel', contactsSchema)
export { ContactsModel }