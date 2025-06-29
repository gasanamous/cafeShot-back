/**
 * initialze socket IO
 */
import { Server } from "socket.io"
import { addManager, removeManager } from "./managerConnection.js"
import { getManagersLoggedIn } from "./managerConnection.js"
import jwt from 'jsonwebtoken'

let io
const initIO = (server) => {

    io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['POST', 'GET', 'DELETE', 'PATCH']
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.headers.token;

        try {
            const { role, managerId } = jwt.verify(token, process.env.JWT_KEY)
            if (role.toLowerCase() == "waiter") {
                socket.managerId = managerId;
                next();
            }
            else {
                throw new Error("Not Allowed")
            }

        } catch (err) {
            next(err)
        }

    })

    io.on('connection', (socket) => {

        const { managerId, id: socketId } = socket
        addManager(managerId, socketId)

        socket.on('disconnect', () => managerId => {
            removeManager(managerId)
        })
    })

    return io
}

const sendOrderNotification = (order) => {

    const onlineWaiters = Object.values(getManagersLoggedIn())

    for (const waiter of onlineWaiters) {
        io.to(waiter).emit("newOrder", order);
    }

}

export {
    initIO,
    sendOrderNotification
}