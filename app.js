// Entry point of server 
import { createServer } from './server.js'
import { createDatabase } from './src/Database/db_connection.js'
import dotenv from 'dotenv'
import { StatusCodes } from 'http-status-codes'

// import routers to pass them to the server
import { menuRouter } from './src/routes/menuRouter.js'
import { appReviewRouter } from './src/routes/appReviewRouter.js'
import { tableRouter } from './src/routes/tableRouter.js'
import { orderRouter } from './src/routes/orderRouter.js'
import { managerRouter } from './src/routes/managerRouter.js'
import { sessionRouter } from './src/routes/sessionRouter.js'
import { contactRouter } from './src/routes/contactRouter.js'
import { getManagersLoggedIn } from './src/socket/managerConnection.js'

const startApp = async () => {
    try {
        dotenv.config()
        await createDatabase(process.env.DATABASE_URL)
        const cafeManagementServer = createServer()

        // connect server routers
        cafeManagementServer.use('/menu', menuRouter)
        cafeManagementServer.use('/review', appReviewRouter)
        cafeManagementServer.use('/table', tableRouter)
        cafeManagementServer.use('/order', orderRouter)
        cafeManagementServer.use('/manager', managerRouter)
        cafeManagementServer.use('/session', sessionRouter)
        cafeManagementServer.use('/contact', contactRouter)
        cafeManagementServer.use('/getSockets', (req, res) => {
            res.json({ managerWithSockets: getManagersLoggedIn() })
        })
        cafeManagementServer.use((req, res) => {
            return res.status(StatusCodes.NOT_FOUND).send({
                message: 'Oops! This route is not found',
            })
        })

        cafeManagementServer.start(process.env.SERVER_PORT)

    } catch (error) {
        console.log('Oops! Error while starting the server. ' + error.message)
    }
}

startApp()