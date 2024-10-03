// Import required modules
const express = require('express'); // Web framework for creating the server
const app = express(); // Initialize express app
const server = require('http').Server(app); // Create HTTP server and pass the express app to it
const io = require('socket.io')(server); // Set up WebSocket (socket.io) for real-time communication
const { v4: uuidV4 } = require('uuid'); // Import the uuid library to generate unique room IDs
const { ExpressPeerServer } = require('peer'); // PeerJS server to handle peer-to-peer connections (commented out for now)

// Create an array to store participant userIds (could be optimized for specific rooms)
let participants = [];

// Set up view engine as EJS for rendering HTML files
app.set('view engine', 'ejs');
app.use(express.static('public')); // Serve static files (like CSS, JS) from the 'public' folder

// Root route: redirect to a unique room ID using uuid
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`); // Redirect to a unique room (e.g., /room-1234)
});

// Room route: Render the 'room' view when accessing a specific room ID
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room }); // Pass roomId to the EJS template for dynamic rendering
});

// Handle WebSocket connections
io.on('connection', socket => {
  // When a user joins a room, handle their room and userId
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId); // Join the user to the specific room
    participants.push(userId); // Add userId to participants list

    // Send the current list of participants to the user who just joined
    socket.emit('current-participants', participants);

    // Notify everyone else in the room that a new user has connected
    socket.to(roomId).emit('user-connected', userId);

    // Handle chat messages sent by this user
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message); // Broadcast the message to everyone in the room
    });

    // Handle when a user disconnects
    socket.on('disconnect', () => {
      // Remove the user from the participants array
      participants = participants.filter(id => id !== userId);

      // Notify everyone else in the room that the user has disconnected
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Start the server and listen on port 3000
server.listen(3000);
