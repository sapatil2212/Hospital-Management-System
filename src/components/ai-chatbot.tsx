"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2 } from "lucide-react";
import styles from "./ai-chatbot.module.css";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I am your AI Health Assistant. How can I help you with our treatments today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.content })) // Pass current messages as history
        }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: "bot", content: data.text }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <Bot size={20} className={styles.headerIcon} />
              <div>
                <h3 className={styles.headerTitle}>AI Health Assistant</h3>
                <p className={styles.headerStatus}>Online • Ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.messagesContainer} ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageWrapper} ${msg.role === "user" ? styles.userWrapper : styles.botWrapper}`}>
                <div className={styles.avatar}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.botWrapper}`}>
                <div className={styles.avatar}><Bot size={14} /></div>
                <div className={`${styles.messageBubble} ${styles.loadingBubble}`}>
                  <Loader2 size={16} className={styles.spin} />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask about treatments..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className={styles.input}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !message.trim()} 
              className={styles.sendBtn}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && <div className={styles.badge}>1</div>}
      </button>
    </div>
  );
}
