require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Test marshrut
app.get('/', (req, res) => {
    res.send('Socket.IO server is running on Render!');
});

// Online foydalanuvchilar ro'yxati
let users = [];

const addOnlineUser = (user, socketId) => {
    const checkUser = users.find(u => u.user._id === user._id);
    if (!checkUser) {
        users.push({ user, socket: socketId });
    }
};

const getSocketId = userId => {
    const user = users.find(u => u.user._id === userId);
    return user ? user.socket : null;
};

// Socket.IO ulanishi
io.on('connection', socket => {
    console.log('User connected', socket.id);

    socket.on('addOnlineUser', user => {
        console.log('User added', user);
        addOnlineUser(user, socket.id);
        io.emit('getOnlineUser', users);
    });

    socket.on('createContact', ({ currentUser, receiver }) => {
        const receiverSocketId = getSocketId(receiver._id);
        console.log('Receiver socket ID:', receiverSocketId);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('getCreatedUser', currentUser);
        }
    });

    socket.on('newMessage', ({ newMessage, receiver, sender }) => {
        const receiverSocketId = getSocketId(receiver._id);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('getNewMessage', { newMessage, sender, receiver });
        }
    });

    socket.on('readMessage', ({ receiver, messages }) => {
        const receiverSocketId = getSocketId(receiver._id);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('getReadMessage', messages);
        }
    });

    socket.on('updateMessage', ({ updateMessage, receiver, sender }) => {
        const receiverId = getSocketId(receiver._id);
        if (receiverId) {
            socket.to(receiverId).emit('getUpdateMessage', { updateMessage, receiver, sender });
        }
    });

    socket.on('deleteMessage', ({ deleteMessage, receiver, sender, filteredMsg }) => {
        const receiverId = getSocketId(receiver._id);
        if (receiverId) {
            socket.to(receiverId).emit('getDeleteMessage', { deleteMessage, receiver, sender, filteredMsg });
        }
    });

    socket.on('typing', ({ receiver, sender, message }) => {
        const receiverId = getSocketId(receiver._id);
        if (receiverId) {
            socket.to(receiverId).emit('getTyping', { sender, message });
        }
    });

    socket.on('disconnect', () => {
        users = users.filter(u => u.socket !== socket.id);
        io.emit('getOnlineUser', users);
        console.log('User disconnected', socket.id);
    });
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});