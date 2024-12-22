const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const User = require('./user');
const Room = require('./room');
const Commands = require('./commands');
const config = require('./config.json');
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store active rooms
const rooms = new Map();

io.on('connection', (socket) => {
    let user;
    let currentRoom;

    socket.on('login', (data) => {
        // Update to handle object with nickname and agentType
        const nickname = typeof data === 'object' ? data.nickname : data;
        let agentType = typeof data === 'object' ? data.agentType : null;

        // Validate agent type
        if (agentType && !config.commands.agent.available.includes(agentType)) {
            agentType = config.agents.default;
        }

        user = {
            id: socket.id,
            nickname: nickname,
            agentType: agentType,
            x: Math.random() * 500,
            y: Math.random() * 500
        };

        socket.emit('login_success', user);
    });

    socket.on('join_room', (roomName) => {
        if (currentRoom) {
            // Clean up old room
            socket.leave(currentRoom.name);
            currentRoom.users.delete(socket.id);

            // Notify others in old room
            io.to(currentRoom.name).emit('user_left', {
                id: socket.id,
                user: user
            });

            // Clean up empty rooms
            if (currentRoom.users.size === 0) {
                rooms.delete(currentRoom.name);
            }
        }

        let room = rooms.get(roomName);
        if (!room) {
            room = {
                name: roomName,
                users: new Map()
            };
            rooms.set(roomName, room);
        }

        room.users.set(socket.id, user);
        currentRoom = room;
        socket.join(roomName);

        // Send all users in room including their agent types
        socket.emit('user_joined', {
            user: user,
            users: Array.from(room.users.values())
        });

        // Notify others of new user
        socket.to(roomName).emit('user_joined', {
            user: user,
            users: [user]
        });
    });

    socket.on('chat_message', (message) => {
        if (!user || !currentRoom) return;

        if (message.startsWith('/')) {
            const cmd = new Commands(socket, user, currentRoom);
            if (cmd.handleCommand(message)) {
                return;
            }
        }

        io.to(currentRoom.name).emit('chat_message', {
            user: user,
            message: message
        });
    });

    socket.on('agent_change', (newAgent) => {
        if (!user || !currentRoom) return;

        // Validate agent type
        if (!config.commands.agent.available.includes(newAgent)) {
            socket.emit('error', `Invalid agent. Available agents: ${config.commands.agent.available.join(', ')}`);
            return;
        }

        user.agentType = newAgent;
        io.to(currentRoom.name).emit('user_update', {
            id: user.id,
            agentType: newAgent
        });
    });

    socket.on('disconnect', () => {
        if (user && currentRoom) {
            // Remove user from room
            currentRoom.users.delete(socket.id);

            // Notify others that user has left
            io.to(currentRoom.name).emit('user_left', {
                id: socket.id,
                user: user
            });

            // Clean up empty rooms
            if (currentRoom.users.size === 0) {
                rooms.delete(currentRoom.name);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
