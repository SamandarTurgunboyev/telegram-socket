const express = require("express")
const socketio = require('socket.io')
const http = require("http")

let users = []

app = express()

const server = http.createServer(app)
const io = socketio(server)

const addOnlineUser = (user, socket) => {
    const checkUser = users.find(u => u.user._id === user._id)
    if (!checkUser) {
        users.push({ user, socket })
    }
}

const getSocketId = userId => {
    const user = users.find(u => u.user._id === userId)
    return user ? user.socket : null
}

io.on('connection', socket => {
    console.log("User connected", socket.id);

    socket.on("addOnlineUser", user => {
        console.log("User added", user);
        addOnlineUser(user, socket.id)
        io.emit("getOnlineUser", users)
    })

    socket.on("createContact", ({ currentUser, receiver }) => {
        const receiverSocketId = getSocketId(receiver._id)
        console.log(receiverSocketId);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('getCreatedUser', currentUser)
        }
    })

    socket.on("newMessage", ({ newMessage, receiver, sender }) => {
        const receiverSocketId = getSocketId(receiver._id)
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("getNewMessage", { newMessage, sender, receiver })
        }
    })

    socket.on("readMessage", ({ receiver, messages }) => {
        const receiverSocketId = getSocketId(receiver._id)
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("getReadMessage", messages)
        }
    })

    socket.on("updateMessage", ({ updateMessage, receiver, sender }) => {
        const receiverId = getSocketId(receiver._id)
        if (receiverId) {
            socket.to(receiverId).emit("getUpdateMessage", { updateMessage, receiver, sender })
        }
    })

    socket.on("deleteMessage", ({ deleteMessage, receiver, sender, filteredMsg }) => {
        const receiverId = getSocketId(receiver._id)
        if (receiverId) {
            socket.to(receiverId).emit("getDeleteMessage", { deleteMessage, receiver, sender, filteredMsg })
        }
    })

    socket.on("typing", ({ receiver, sender, message }) => {
        const receiverId = getSocketId(receiver._id)
        if (receiverId) {
            socket.to(receiverId).emit("getTyping", { sender, message })
        }
    })

    socket.on('disconnect', () => {
        users = users.filter(u => u.socket !== socket.id)
        io.emit("getOnlineUser", users)
    })
})

const PORT = process.env.PORT || 5000

server.listen(prototype, () => {
    console.log(`socket Running on port ${PORT}`);
    
})