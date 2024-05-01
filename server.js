const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store socket IDs of connected clients
let clients = {};
let rooms = {};

io.on('connection', socket => {
    console.log('User connected:', socket.id);

    // Store the socket ID of the connected client
    clients[socket.id] = socket;

    socket.on('createRoom', () => {
        // Generate a unique room ID
        const roomId = generateRoomId();
        // Store the room ID associated with the client
        rooms[socket.id] = roomId;
        // Join the room
        socket.join(roomId);
        // Notify the client about the created room
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', roomId => {
        // Store the room ID associated with the client
        rooms[socket.id] = roomId;
        // Join the room
        socket.join(roomId);
        // Notify the client about successful room joining
        socket.emit('roomJoined', roomId);
    });

    socket.on('offer', (offer, targetClientId) => {
        const roomId = rooms[socket.id];
        if (roomId) {
            // Broadcast the offer to all clients in the same room except the sender
            socket.to(roomId).emit('offer', offer, socket.id);
        }
    });

    socket.on('answer', (answer, callerClientId) => {
        const roomId = rooms[socket.id];
        if (roomId) {
            // Broadcast the answer to all clients in the same room except the sender
            socket.to(roomId).emit('answer', answer);
        }
    });

    socket.on('ice-candidate', (candidate, targetClientId) => {
        const roomId = rooms[socket.id];
        if (roomId) {
            // Broadcast the ICE candidate to all clients in the same room except the sender
            socket.to(roomId).emit('ice-candidate', candidate);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the socket ID from the clients and rooms objects when a client disconnects
        delete clients[socket.id];
        const roomId = rooms[socket.id];
        if (roomId) {
            delete rooms[socket.id];
            // Check if the room is empty after client disconnects
            if (io.sockets.adapter.rooms.get(roomId).size === 0) {
                // Room is empty, clean up the room
                console.log(`Room ${roomId} is empty, cleaning up...`);
            }
        }
    });
});

function generateRoomId() {
    // Generate a random alphanumeric room ID (e.g., using UUID or shortid library)
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
