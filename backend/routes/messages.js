
const express = require('express');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const router = express.Router();
const { getUnreadCounts, markMessagesAsRead } = require('../controllers/messageController');
// Unread message count badge routes
router.get('/unread-counts', auth, getUnreadCounts);
router.patch('/mark-read/:senderId', auth, markMessagesAsRead);

// Fetch the last message for each contact for a user
router.get('/last-messages/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
      { 
        $match: { 
          $or: [{ senderId: userObjId }, { receiverId: userObjId }] 
        } 
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              { s: "$senderId", r: "$receiverId" },
              { s: "$receiverId", r: "$senderId" }
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$lastMessage" } }
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch conversation between two users (Protected)
router.get('/:senderId/:receiverId', auth, async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message (Fallback - Protected)
router.post('/send', auth, async (req, res) => {
  try {
    const { senderId, receiverId, content, type, audioData, transcript, fileUrl, fileName, fileType } = req.body;
    
    const newMessage = new Message({ 
      senderId, 
      receiverId, 
      content, 
      type, 
      audioData, 
      transcript, 
      fileUrl, 
      fileName, 
      fileType 
    });
    
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear conversation history (Protected)
router.delete('/clear/:senderId/:receiverId', auth, async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    await Message.deleteMany({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });
    res.json({ message: 'Conversation cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread counts for a user (Protected)
router.get('/unread/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching unread counts for userId:', userId);
    
    // Ensure userId is converted correctly
    let userObjId;
    try {
      userObjId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: userObjId, read: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } }
    ]);
    
    console.log('Aggregation result:', unreadCounts);
    res.json(unreadCounts);
  } catch (err) {
    console.error('API Error /unread:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Delete messages (Protected)
router.post('/delete-bulk', auth, async (req, res) => {
  try {
    const { messageIds, type } = req.body; // type: 'me' or 'everyone'
    const userId = req.user._id;
    const io = req.app.get('io');

    const results = [];
    for (const id of messageIds) {
      const message = await Message.findById(id);
      if (!message) continue;

      if (type === 'everyone') {
        if (String(message.senderId) === String(userId)) {
          message.deletedForEveryone = true;
          message.content = '🚫 This message was deleted';
          message.fileUrl = null;
          message.audioData = null;
          message.fileName = null;
          await message.save();
          
          // Broadcast to both participants
          io.to(String(message.receiverId)).to(String(message.senderId)).emit('messageDeleted', { 
            messageId: id, 
            deletedForEveryone: true 
          });
        }
      } else {
        if (!message.deletedFor.includes(userId)) {
          message.deletedFor.push(userId);
          await message.save();
        }
      }
      results.push(id);
    }

    res.json({ success: true, count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
