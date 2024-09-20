const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer');
// const peerServer = ExpressPeerServer(server, {
//   debug: true
// });
// const rooms = {};
let participants = [];

// app.use('/peerjs', peerServer);
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
  //   if (!rooms[roomId]) {
  //     rooms[roomId] = [];
  // }
  // rooms[roomId].push(userId);
    
    socket.join(roomId);
    participants.push(userId);
    socket.emit('current-participants', participants);
    // socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.to(roomId).emit("user-connected", userId);


    // io.to(roomId).emit('update-participant-list', rooms[roomId]);

        socket.on('message', (message) => {
          //send message to the same room
          io.to(roomId).emit('createMessage', message)
        });
        
        socket.on('disconnect', () => {
          // rooms[roomId] = rooms[roomId].filter(id => id !== userId);
          // io.to(roomId).emit('update-participant-list', rooms[roomId]);
          participants = participants.filter(id => id !== userId);
          socket.to(roomId).emit('user-disconnected', userId);
      });
  });
});

server.listen(3000)