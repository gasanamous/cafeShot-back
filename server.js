// server creation module:
/*
    * create a express server with setting up the required configuration for requests core, json data,
    * cookie parsing and url encoded data parsing 
 */

import express from 'express'
import cors from 'cors'
import { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import swaggerUI from 'swagger-ui-express'
import mainDocs from './src/config/swagger.js'
import http from 'http'
import { initIO } from './src/socket/socket.js'
import { StatusCodes } from 'http-status-codes'
import { listFiles } from './src/utils/services/services.js'

let io
const createServer = () => {

    const app = express()

    /** Setup basic middlewares */
    app.use(json())
    app.use(urlencoded({ limit: '10mb' }))
    app.use(cors({ credentials: true, origin: 'https://cafeshot.onrender.com' }))
    app.use(cookieParser())
    app.use('/utils', express.static('src/utils'))
    app.use('/docs', swaggerUI.serve, swaggerUI.setup(mainDocs))
    app.use('/list-files', async(req, res) => {
        return res.send(listFiles(req))
    } )
    app.use((err, req, res, next) => {
        console.log(err.message)
        res.status(StatusCodes.BAD_REQUEST).json(err.message)
    })
    const server = http.createServer(app)
    io = initIO(server)
    // add prototype method for start to listening 
    app.start = (port) => {
        server.listen(port || 3000, () => console.log(`Server connection (PORT: ${port}): OK`))
    }

    return app
}

export {
    createServer,
    io
}
