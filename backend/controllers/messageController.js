const Message = require('../models/Message');

// ...existing controller functions...

// Get unread message counts per sender for the logged-in user
exports.getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;
    const result = await Message.aggregate([
      { $match: { receiverId: myId, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    const unreadCounts = {};
    result.forEach(r => { unreadCounts[r._id] = r.count; });
    res.json({ unreadCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark all messages from a sender as read for the logged-in user
exports.markMessagesAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const senderId = req.params.senderId;

    await Message.updateMany(
      { senderId, receiverId: myId, read: false },
      { $set: { read: true } }
    );

    // 🔥 Emit event (IMPORTANT)
    const io = req.app.get('io');
    io.to(senderId.toString()).emit('messagesRead', {
      readerId: myId,
    });

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};