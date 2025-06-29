const TABLE_STATUS = Object.freeze({
    BOOKED: "Booked",
    AVAILABLE: "Available"
})

const ORDER_STATUS = Object.freeze({
    PENDING: "Pending",
    CANCELED: "Canceled",
    PREPARING: "Preparing",
    SERVED: "Served",
    PAID: "Paid"

})

const MANAGER_STATUS = Object.freeze({
    ACTIVE: "active",
    RESTRICTED: "restricted"
})
const MANAGER_ROLES = Object.freeze({
    ADMIN: "Admin",
    WAITER: "Waiter"
})
export {
    TABLE_STATUS,
    ORDER_STATUS,
    MANAGER_STATUS,
    MANAGER_ROLES
}