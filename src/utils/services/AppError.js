/**
 * AppError class: for handling other popular errors, for example i want to throw exception if cafe manager 
 * submitted an empty form for adding new menu items.
 * 
 * ##### My code implementation done with regardlessing any client-side validation
 */
class AppError extends Error {
    constructor(name, message, errorCode) {
        super()
        this.name = name
        this.message = message
        this.errorCode = errorCode
    }
}

export default AppError