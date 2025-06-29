/**
 * UserModel: This model (document) is for storing manager and order manager (garson's) data
 */
import { mongoose } from "../Database/db_connection.js";
import { capitalizeFirstLetter } from "../utils/services/services.js";
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { MANAGER_STATUS, MANAGER_ROLES } from "../utils/enums.js";

dotenv.config()
const { Schema } = mongoose

const managerSchema = new Schema({

    _id: {
        type: String,
        required: [true, "Please provide manager ID"],
    },
    firstName: {
        type: String,
        required: [true, "Please enter manager firstname"],
        set: (firstName) => capitalizeFirstLetter(firstName.trim())
    },
    lastName: {
        type: String,
        required: [true, "Please enter manager surname"],
        set: (surname) => capitalizeFirstLetter(surname.trim())
    },
    accountEmail: {
        type: String,
        validate: {
            validator: (accountEmail) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(accountEmail),
            message: "Invalid email. Please use a valid format for your email address"
        },
        set: (accountEmail) => accountEmail.trim().toLowerCase()
    },
    accountPassword: {
        type: String,
        required: [true, "Please provide a password"],
        validate: {
            validator: (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password),
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, $, !, %, , ?, &)"
        }
    },
    phoneNumber: {
        type: String,
        required: [true, "Please provide a phone number"],
        validate: {
            validator: (phoneNumber) => /^\d{10}$/.test(phoneNumber),
            message: "Please enter a valid phone number"
        }
    },
    role: {
        type: String,
        enum: {
            values: Object.values(MANAGER_ROLES),
            message: "Manager role can be only either admin or waiter"
        },
        set: (role) => capitalizeFirstLetter(role.trim())
    },
    status: {
        type: String,
        enum: Object.values(MANAGER_STATUS),
        default: MANAGER_STATUS.ACTIVE,
        set: (status) => status.toLowerCase()
    },
    workingHours: {
        type: String,
        required: [true, "Please provide working hours"],
        enum: {
            values: ["Morning shift", "Evening shift", "Full time"],
            message: "Working hours can be only either morning shift, evening shift or full time"
        },
        set: (workingHours) => capitalizeFirstLetter(workingHours.trim())
    },
    createdAt: {
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
                    hour12: true,

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
}, {
    toJSON: { getters: true }
})

managerSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret) => {
        ret.managerId = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.accountPassword;
        return ret;
    }
})

/** This middleware for generating manager ID, formatting phone number and encrypt password */
managerSchema.pre('save', async function (next) {

    /** Format ID */
    if (this.firstName && this.lastName && this.phoneNumber) {
        const firstName = this.firstName.charAt(0).toLowerCase()
        const lastName = this.lastName.toLowerCase()
        const lastFourDigits = this.phoneNumber.slice(6)
        this._id = `${firstName}.${lastName}${lastFourDigits}`
    }

    /** If this is a new account, handle password operations */
    if (this.isNew) {
        const validationError = new mongoose.Error.ValidationError(this)
        /** Check if password is weak, throw validation error */
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!strongPasswordRegex.test(this.accountPassword)) {
            validationError.addError('accountPassword', {
                path: 'accountPassword',
                message: "Weak password, Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, $, !, %, , ?, &)",
                value: this.accountPassword
            })
            next(validationError)
        }

        this.accountPassword = await bcrypt.hash(this.accountPassword, Number(process.env.PASSWORD_ECNRYPTION_ROUNDS))
    }

    next()
})

/** To update updatedAt */
managerSchema.pre('updateOne', function () {
    const newDoc = this['_update']['$set']
    newDoc.updatedAt = Date.now()
})

const ManagerModel = mongoose.model('ManagerModel', managerSchema)
export { ManagerModel, managerSchema }