import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI cafe assistant. Ask me to find a place to work, study, or just chill." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({ messages: newMessages });
      setMessages((prev) => [...prev, response.data.message]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error.response?.data?.message || "Sorry, I hit an error connecting to my brain." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <h3>☕ AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant loading">
                <p>Thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a cafe..."
            />
            <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
          </form>
        </div>
      ) : (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          ✨ Ask AI
        </button>
      )}
    </div>
  );
}
