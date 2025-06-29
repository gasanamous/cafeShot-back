let managerConnectionMap = new Map()

const addManager = (managerId, socketId) => {
    managerConnectionMap.set(managerId, socketId)
}

const removeManager = (managerId) => {
    managerConnectionMap.delete(managerId)
}

const getManagersLoggedIn = () => {
    return Object.fromEntries(managerConnectionMap)
}

export {
    getManagersLoggedIn,
    addManager,
    removeManager
}