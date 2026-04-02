import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function useUnreadCount() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const recalcTotal = useCallback((counts) => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, []);

  // ✅ Fetch initial unread counts
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("chat-token");

        const res = await fetch("http://localhost:5000/api/messages/unread-counts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        const formatted = {};
        Object.keys(data.unreadCounts || {}).forEach(key => {
          formatted[String(key)] = data.unreadCounts[key];
        });

        setUnreadCounts(formatted);
        setTotalUnread(recalcTotal(formatted));
      } catch (err) {
        console.error("Unread fetch error:", err);
      }
    };

    if (user) fetchUnread();
  }, [user, recalcTotal]);

  // ✅ Real-time new message
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message) => {
      if (message.senderId !== user.id) {
        setUnreadCounts((prev) => {
          const next = { ...prev };
          const senderId = String(message.senderId);

          next[senderId] = (next[senderId] || 0) + 1;

          setTotalUnread(recalcTotal(next));
          return next;
        });
      }
    };

    socket.on("receiveMessage", handleNewMessage);

    return () => socket.off("receiveMessage", handleNewMessage);
  }, [socket, user, recalcTotal]);

  // ✅ Real-time read sync
  useEffect(() => {
    if (!socket) return;

    const handleRead = ({ readerId }) => {
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[String(readerId)];
        setTotalUnread(recalcTotal(next));
        return next;
      });
    };

    socket.on("messagesRead", handleRead);

    return () => socket.off("messagesRead", handleRead);
  }, [socket, recalcTotal]);

  // ✅ Mark as read
  const markAsRead = useCallback(async (senderId) => {
    try {
      const token = localStorage.getItem("chat-token");

      await fetch(`http://localhost:5000/api/messages/mark-read/${senderId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[String(senderId)];
        setTotalUnread(recalcTotal(next));
        return next;
      });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  }, [recalcTotal]);

  return { unreadCounts, totalUnread, markAsRead };
}