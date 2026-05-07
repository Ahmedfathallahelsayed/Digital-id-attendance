import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  FaPaperPlane,
  FaTimes,
  FaComments,
  FaLightbulb,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaTrash,
  FaExpandAlt,
} from "react-icons/fa";

import Groq from "groq-sdk";

import "./ChatAssistant.css";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function ChatAssistant({ role, data }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text:
          role === "student"
            ? "Hi 👋 I’m your AI assistant. Ask me anything about your attendance, schedule, classes, or dashboard."
            : "Hi 👋 I’m your AI assistant. Ask me anything about students, classes, attendance, or sessions.",
      },
    ]);
  }, [role]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  const suggestions = useMemo(() => {
    if (role === "student") {
      return [
        "What is my attendance rate?",
        "What classes do I have today?",
        "Show my weekly schedule",
        "What is my recent activity?",
        "نسبة حضوري كام؟",
        "عندي ايه النهارده؟",
      ];
    }

    return [
      "How many students do I have?",
      "What classes do I have today?",
      "What is my average attendance?",
      "كام طالب عندي؟",
      "متوسط الحضور كام؟",
    ];
  }, [role]);

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      sender: "user",
      text: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a smart university dashboard assistant. Answer clearly and shortly in Arabic or English.",
          },
          {
            role: "user",
            content: `
Role:
${role}

Dashboard Data:
${JSON.stringify(data)}

Question:
${messageText}
              `,
          },
        ],

        model: "llama-3.3-70b-versatile",
      });

      const reply = completion.choices[0].message.content;

      const botMessage = {
        sender: "bot",
        text: reply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log(error);

      const botMessage = {
        sender: "bot",
        text: "AI Error.",
      };

      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Chat cleared successfully.",
      },
    ]);
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          <FaComments />
        </button>
      )}

      {isOpen && (
        <div className={`chat-assistant ${isExpanded ? "expanded" : ""}`}>
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-bot-icon">
                {role === "student" ? (
                  <FaUserGraduate />
                ) : (
                  <FaChalkboardTeacher />
                )}
              </div>

              <div>
                <h4>AI Assistant</h4>

                <p>
                  {role === "student" ? "Student Helper" : "Instructor Helper"}
                </p>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                className="chat-header-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <FaExpandAlt />
              </button>

              <button className="chat-header-btn" onClick={clearChat}>
                <FaTrash />
              </button>

              <button
                className="chat-header-btn"
                onClick={() => setIsOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="chat-suggestions">
            <div className="chat-suggestion-title">
              <FaLightbulb />
              <span>Suggestions</span>
            </div>

            <div className="chat-suggestion-list">
              {suggestions.map((item, index) => (
                <button
                  key={index}
                  className="chat-suggestion-btn"
                  onClick={() => sendMessage(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${
                  msg.sender === "user" ? "user" : "bot"
                }`}
              >
                <pre>{msg.text}</pre>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrap">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button onClick={() => sendMessage()}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
