import { useState, useRef, useEffect } from "react";
import { chatWithAI } from "../../api/ai";

const INITIAL_MESSAGE = {
  id: 1,
  role: "ai",
  content: "مرحباً! أنا هنا لمساعدتك في هذا الدرس. يمكنني شرح أي مفهوم أو الإجابة على أسئلتك.",
};

const TypingDots = () => (
  <div className="typing-dots">
    {[0, 1, 2].map((i) => (
      <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

export default function AIChat() {
  const [messages,  setMessages]  = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length <= 1) return; // لا تعمل scroll على الرسالة الأولى
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    setInputValue("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text }]);
    setLoading(true);

    try {
      const { data } = await chatWithAI(text, sessionId);
      setSessionId(data.data.sessionId);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", content: data.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", content: "عذراً، حدث خطأ. حاول مرة أخرى.", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setSessionId(null);
  };

  return (
    <section className="ai-chat glass-panel anim-enter anim-delay-1">
      {/* Header */}
      <div className="ai-chat__header">
        <div className="ai-chat__header-info">
          <div className="ai-chat__avatar">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <p className="ai-chat__title">المساعد الذكي</p>
            <div className="ai-chat__status">
              <span className="ai-chat__status-dot pulse" />
              <span className="ai-chat__status-text">متصل ومرتبط بهذا الدرس</span>
            </div>
          </div>
        </div>
        <button className="ai-chat__clear-btn" onClick={handleClear}>
          مسح المحادثة
        </button>
      </div>

      {/* Messages */}
      <div className="ai-chat__messages scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`chat-msg anim-enter ${i === 0 ? "anim-delay-2" : "anim-delay-3"} ${msg.role === "user" ? "chat-msg--user" : ""}`}
          >
            <div className={`chat-msg__icon ${msg.role === "ai" ? "chat-msg__icon--ai" : "chat-msg__icon--user"}`}>
              {msg.role === "ai" ? "AI" : "أ"}
            </div>
            <div className={`chat-bubble ${msg.role === "ai" ? "chat-bubble--ai" : msg.isError ? "chat-bubble--error" : "chat-bubble--user"}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="chat-msg">
            <div className="chat-msg__icon chat-msg__icon--ai">AI</div>
            <div className="chat-bubble chat-bubble--ai">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="ai-chat__input-area">
        <div className="ai-chat__input-wrap">
          <input
            className="ai-chat__input"
            type="text"
            placeholder="اسأل عن أي شيء في الدرس..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="ai-chat__send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            aria-label="إرسال"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
         
        </div>
      </div>
    </section>
  );
}