// import mongoose package from NPM
import mongoose from 'mongoose'

// setup a connection with database
async function createDatabase(url) {

    try {
         await mongoose.connect(url)
         console.log('Database connection: OK')
    } catch (error) {
        console.log('Database connection: ERROR')
        throw error
    }

}

export { createDatabase }
export { mongoose }

