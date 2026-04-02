require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Store io in app instance for use in controllers
app.set('io', io);


// Socket.io Connection
const users = new Map(); // userId -> Set(socketId)
const activeCalls = new Map(); // userId -> callDetails

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId); // Join personal room for targeted emits

    if (!users.has(userId)) {
      users.set(userId, new Set());
    }
    users.get(userId).add(socket.id);

    console.log('User joined with userId:', userId);
    io.emit('onlineUsers', Array.from(users.keys()));
  });

  // ✅ SEND MESSAGE
  socket.on('sendMessage', async (data, callback) => {
    const newMessage = new Message(data);
    await newMessage.save();

    // Emit to receiver's room (targeted)
    io.to(data.receiverId).emit('receiveMessage', newMessage);
    
    // Ack back to sender
    if (typeof callback === 'function') {
      callback(newMessage);
    }
  });

  const saveCallMessage = async ({ senderId, receiverId, type, status, duration }) => {
    const callMessage = new Message({
      senderId,
      receiverId,
      type: 'call',
      content: `${type.charAt(0).toUpperCase() + type.slice(1)} call`,
      fileType: status === 'Declined' ? 'Call declined' : (duration === '0:00' ? 'Not answered' : 'Completed'),
      fileName: duration === '0:00' ? '' : duration,
    });
    await callMessage.save();
    io.to(receiverId).emit('receiveMessage', callMessage);
    io.to(senderId).emit('receiveMessage', callMessage);
  };

  // ✅ CALLING
  socket.on('callUser', ({ senderId, receiverId, type }) => {
    io.to(receiverId).emit('incomingCall', { from: senderId, type });
  });

  socket.on('callResponse', ({ accepted, from, to, type }) => {
    if (!accepted) {
      saveCallMessage({ senderId: from, receiverId: to, type, status: 'Declined' });
    } else {
      activeCalls.set(from, { receiverId: to, type, startTime: Date.now() });
      activeCalls.set(to, { receiverId: from, type, startTime: Date.now() });
    }
    io.to(from).emit('callResponse', { accepted, from: to });
  });

  socket.on('endCall', ({ senderId, receiverId, type, duration }) => {
    console.log(`Call ended between ${senderId} and ${receiverId}`);
    saveCallMessage({ senderId, receiverId, type, status: 'Completed', duration });
    activeCalls.delete(senderId);
    activeCalls.delete(receiverId);
    io.to(receiverId).emit('callEnded');
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    console.log(`User ${senderId} is typing to ${receiverId}`);
    io.to(receiverId).emit('userTyping', { senderId });
  });

  socket.on('stopTyping', ({ senderId, receiverId }) => {
    console.log(`User ${senderId} stopped typing to ${receiverId}`);
    io.to(receiverId).emit('userStoppedTyping', { senderId });
  });

  // ✅ RECORDING VOICE
  socket.on('recording', ({ senderId, receiverId }) => {
    console.log(`User ${senderId} is recording to ${receiverId}`);
    io.to(receiverId).emit('userRecording', { senderId });
  });

  socket.on('stopRecording', ({ senderId, receiverId }) => {
    console.log(`User ${senderId} stopped recording to ${receiverId}`);
    io.to(receiverId).emit('userStoppedRecording', { senderId });
  });

  // ✅ MARK AS READ
  socket.on('markAsRead', async ({ senderId, receiverId }) => {
    await Message.updateMany(
      { senderId, receiverId, read: false },
      { $set: { read: true } }
    );

    // Notify sender → double tick blue
    io.to(senderId).emit('messagesRead', { readerId: receiverId });
  });

  // ✅ DISCONNECT
  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketIds] of users.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          users.delete(userId);
          disconnectedUserId = userId;
        }
        break;
      }
    }
    
    // Cleanup for other users
    if (disconnectedUserId) {
      io.emit('onlineUsers', Array.from(users.keys()));
      io.emit('userStoppedTyping', { senderId: disconnectedUserId });
      io.emit('userStoppedRecording', { senderId: disconnectedUserId });
    }
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));