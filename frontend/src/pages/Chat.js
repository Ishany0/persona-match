import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [otherId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await sendMessage(user.id, otherId, body.trim());
    setBody("");
    refresh();
  }

  if (!user) return null;
  const name = decodeURIComponent(otherName);

  return (
    <div className="page chat-page-new">
      <div className="chat-head"><div><Link to="/matches" className="back-link">← Back to matches</Link><h1>Chat with {name}</h1><p>Start with something simple. You already have a shared interest.</p></div><div className="chat-person"><span>{name.charAt(0).toUpperCase()}</span><div><strong>{name}</strong><small>PersonaMatch connection</small></div></div></div>
      <div className="chat-panel"><div className="chat-messages">{messages.length === 0 && <div className="chat-empty">Say hi 👋</div>}{messages.map((m, i) => <div key={i} className={`chat-bubble ${String(m.sender_id) === String(user.id) ? "mine" : "theirs"}`}>{m.body}</div>)}<div ref={bottomRef} /></div><form onSubmit={handleSend} className="chat-compose"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Message ${name}...`} /><button className="send-btn" type="submit">→</button></form></div>
    </div>
  );
}
