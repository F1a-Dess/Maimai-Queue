import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.IO
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Replace with your frontend URL
        methods: ['GET', 'POST'],
    },
});

let players = [];
let currentPlayers = []; // Variable to track the current player

io.on('connection', (socket) => {
    // Initial connection
    console.log('A user connected:', socket.id);

    // Send initial data to the client
    socket.emit('updatePlayers', { players });
    socket.emit('currentPlayerUpdate', currentPlayers);
    socket.emit('timeUpdate', getCurrentTime());

    // Handle adding a player
    socket.on('addPlayer', (player) => {
        players.push(player);
        currentPlayers = player; // Set the current player to the newly added player
        // io.emit('currentPlayerUpdate', currentPlayers); // Emit the current player update
        // console.log('Current player updated:', currentPlayers); // Debugging line

        io.emit('updatePlayers', { players });
        console.log('Player added: ', player, 'at: ', getCurrentTime());
    });

    // Handle removing a player 
    socket.on('removePlayer', (player) => {
        players = players.filter((p) => p !== player);
        if (currentPlayers === player) {
            currentPlayers = null; // Clear current player if removed
            io.emit('currentPlayerUpdate', currentPlayers); // Emit the current player update
            console.log('Current player updated:', currentPlayers); // Debugging line
        }
        io.emit('updatePlayers', { players });
        console.log('Player removed:', player, 'at: ', getCurrentTime());
    });

    // Handle moving a player
    socket.on('movePlayer', ({from, to}) => {
        if (from >= 0 && to >= 0 && from < players.length && to < players.length) {
            const [movedPlayer] = players.splice(from, 1);
            players.splice(to, 0, movedPlayer);
            io.emit('updatePlayers', { players });
        }
        console.log('Player moved:', from, to, 'at: ', getCurrentTime());
    });

    // Update the queue when a new player is added
    socket.on('updatePlayers', (updatedPlayers) => {
        players = updatedPlayers;
        io.emit('updatePlayers', players); // Broadcast to all clients
    });

    // Listen for updates to current players
    socket.on('updateCurrentPlayers', (updatedPlayers) => {
        console.log('Updated current players:', updatedPlayers);
        currentPlayers = updatedPlayers;

        // Broadcast the update to all connected clients
        io.emit('currentPlayerUpdate', currentPlayers);
    });

    // Send the current players when a client connects
    socket.emit('currentPlayerUpdate', currentPlayers);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Get current time in GMT+7
const getCurrentTime = () => {
    const options = { timezone: 'Asia/Jakarta', hour12: false };
    return new Date().toLocaleString('en-US', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Broadcast current time to all clients every second
setInterval(() => {
    io.emit('timeUpdate', getCurrentTime());
}, 1000);

// Serve a simple API endpoint
app.get('/', (req, res) => {
    res.send('Server is running!');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
