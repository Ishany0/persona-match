import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getConversation, sendMessage } from "../api";

export default function Chat({ user }) {
  const { otherId, otherName } = useParams();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const bottomRef = useRef(null);

  async function refresh() {
    const convo = await getConversation(user.id, otherId);
    setMessages(convo);
  }

  useEffect(() => {
    refresh();
    // simple polling so both sides see new messages without a full refresh
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await sendMessage(user.id, otherId, body.trim());
    setBody("");
    refresh();
  }

  if (!user) return null;

  return (
    <div className="page chat-page">
      <h2>Chat with {decodeURIComponent(otherName)}</h2>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div
            key={i}
            className={"chat-bubble " + (String(m.sender_id) === String(user.id) ? "mine" : "theirs")}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-row">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="btn primary">Send</button>
      </form>
    </div>
  );
}
