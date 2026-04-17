import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaComments,
  FaLightbulb,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaTrash,
  FaExpandAlt,
} from "react-icons/fa";
import "./ChatAssistant.css";

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
            ? "Hi 👋 I’m your AI assistant.\nYou can ask me about your attendance, classes, today’s schedule, weekly schedule, recent activity, or digital ID."
            : "Hi 👋 I’m your AI assistant.\nYou can ask me about your students, attendance, sessions, classes, today’s schedule, and recent activity.",
      },
    ]);
  }, [role]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const suggestions = useMemo(() => {
    if (role === "student") {
      return [
        "What is my attendance rate?",
        "What classes do I have today?",
        "Show my weekly schedule",
        "How many classes did I join?",
        "What is my recent activity?",
        "Where is my digital ID?",
        "نسبة حضوري كام؟",
        "عندي ايه النهارده؟",
        "وريني الجدول الاسبوعي",
      ];
    }

    if (role === "instructor") {
      return [
        "How many students do I have?",
        "What classes do I have today?",
        "What is my average attendance?",
        "How many sessions this week?",
        "Show all my classes",
        "What is my recent activity?",
        "كام طالب عندي؟",
        "عندي كام محاضرة النهارده؟",
        "متوسط الحضور كام؟",
      ];
    }

    return ["What can you do?"];
  }, [role]);

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[؟?.,!]/g, "")
      .replace(/\s+/g, " ");
  };

  const includesAny = (msg, words) => {
    return words.some((word) => msg.includes(word));
  };

  const formatList = (items) => {
    if (!items || items.length === 0) return "No data found.";

    return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  };

  const getTodayClassesText = (todayClasses, isStudent = true) => {
    if (!todayClasses || todayClasses.length === 0) {
      return isStudent
        ? "You have no classes today."
        : "You have no classes scheduled for today.";
    }

    const lines = todayClasses.map((cls, index) => {
      const name = cls.className || cls.name || "Class";
      const code = cls.classCode || "—";
      const start = cls.fromTime || "—";
      const end = cls.toTime || "—";
      return `${index + 1}. ${name} (${code}) from ${start} to ${end}`;
    });

    return `Here are today's classes:\n${lines.join("\n")}`;
  };

  const getWeeklyClassesText = (allClasses, isStudent = true) => {
    if (!allClasses || allClasses.length === 0) {
      return isStudent
        ? "You are not enrolled in any classes yet."
        : "You have not created any classes yet.";
    }

    const lines = allClasses.map((cls, index) => {
      const name = cls.className || cls.name || "Class";
      const code = cls.classCode||cls.classId || "—";
      const day = cls.day || "—";
      const start = cls.fromTime||cls.startTime || "—";
      const end = cls.toTime||cls.endTime || "—";
      return `${index + 1}. ${name} (${code}) - ${day} from ${start} to ${end}`;
    });

    return `Here is the full list:\n${lines.join("\n")}`;
  };

  const getActivityFeedText = (feed) => {
    if (!feed || feed.length === 0) {
      return "No recent activity found.";
    }

    return feed.map((item, index) => `${index + 1}. ${item.text}`).join("\n");
  };

  const getLowAttendanceAdvice = (rate) => {
    if (rate >= 85) return "Your attendance is very good. Keep it up ✅";
    if (rate >= 70) return "Your attendance is acceptable, but try not to miss more lectures.";
    if (rate >= 50) return "Your attendance is getting low. You should attend more lectures soon.";
    return "Your attendance is critically low. You need to improve it urgently.";
  };

  const getBotReply = (rawMessage) => {
    const msg = normalizeText(rawMessage);

    if (!msg) return "Please type a message first.";

    // ===== COMMON =====
    if (
      includesAny(msg, [
        "help",
        "what can you do",
        "what do you do",
        "who are you",
        "how can you help",
        "ممكن تساعدني في ايه",
        "بتعمل ايه",
        "تقدر تعمل ايه",
        "مين انت",
        "مساعدة",
      ])
    ) {
      if (role === "student") {
        return "I can help you with:\n1. Your attendance rate\n2. Today’s classes\n3. Weekly schedule\n4. Joined classes\n5. Recent activity\n6. Digital ID location";
      }

      if (role === "instructor") {
        return "I can help you with:\n1. Total students\n2. Today’s classes\n3. Average attendance\n4. Sessions this week\n5. All classes\n6. Recent activity";
      }

      return "I can help you with dashboard information.";
    }

    if (
      includesAny(msg, [
        "hi",
        "hello",
        "hey",
        "السلام عليكم",
        "اهلا",
        "هاي",
        "مرحبا",
        "ازيك",
      ])
    ) {
      return role === "student"
        ? "Hello 👋 Ready to help with your attendance, schedule, and classes."
        : "Hello 👋 Ready to help with your classes, students, and attendance.";
    }

    if (includesAny(msg, ["thanks", "thank you", "شكرا", "متشكر", "تسلم"])) {
      return "You’re welcome 🌟";
    }

    if (includesAny(msg, ["clear", "clear chat", "امسح", "امسح الشات"])) {
      setMessages([
        {
          sender: "bot",
          text: "Chat cleared successfully.",
        },
      ]);
      return "Chat cleared successfully.";
    }

    // ===== STUDENT =====
    if (role === "student") {
      if (
        includesAny(msg, [
          "attendance",
          "attendance rate",
          "my attendance",
          "attendance percentage",
          "نسبة حضوري",
          "الحضور",
          "حضوري",
          "حضوري كام",
          "نسبتي كام",
        ])
      ) {
        const rate = data.studentAttendanceRate ?? 0;
        return `Your attendance rate is ${rate}%.\n${getLowAttendanceAdvice(rate)}`;
      }

      if (
        includesAny(msg, [
          "today",
          "today classes",
          "classes today",
          "schedule today",
          "today schedule",
          "جدولي النهارده",
          "عندي ايه النهارده",
          "محاضرات النهارده",
          "النهارده",
        ])
      ) {
        return getTodayClassesText(data.todayStudentClasses, true);
      }

      if (
        includesAny(msg, [
          "joined classes",
          "how many classes",
          "my classes",
          "joined",
          "enrolled",
          "عدد المواد",
          "مشترك في كام ماده",
          "انا مشترك في كام",
          "موادي",
          "كلاساتي",
        ])
      ) {
        return `You are enrolled in ${data.studentEnrollments?.length || 0} classes.`;
      }

      if (
        includesAny(msg, [
          "weekly schedule",
          "week schedule",
          "all classes",
          "my weekly classes",
          "الجدول الاسبوعي",
          "كل المواد",
          "كل الكلاسات",
          "جدولي الاسبوعي",
          "الاسبوع",
        ])
      ) {
        return getWeeklyClassesText(data.studentEnrollments, true);
      }

      if (
        includesAny(msg, [
          "recent activity",
          "activity",
          "history",
          "recent",
          "النشاط",
          "اخر نشاط",
          "اخر حاجة",
          "history log",
        ])
      ) {
        return getActivityFeedText(data.studentActivityFeed);
      }

      if (
        includesAny(msg, [
          "digital id",
          "id",
          "my id",
          "بطاقتي",
          "الكارنيه",
          "الديجيتال id",
          "فين البطاقة",
        ])
      ) {
        return "You can open your Digital ID from the sidebar using the Digital ID page.";
      }

      if (
        includesAny(msg, [
          "advice",
          "recommendation",
          "suggestion",
          "نصيحه",
          "اقتراح",
          "اعمل ايه",
        ])
      ) {
        const rate = data.studentAttendanceRate ?? 0;
        if (rate >= 85) {
          return "You’re doing well. Keep attending consistently and review your weekly schedule regularly.";
        }
        if (rate >= 70) {
          return "Try not to miss upcoming lectures and check your schedule daily.";
        }
        return "You should focus on attending every lecture from now on and monitor your schedule closely.";
      }

      return "I didn’t fully understand.\nTry asking about:\n- your attendance\n- today’s classes\n- weekly schedule\n- joined classes\n- recent activity\n- digital ID";
    }

    // ===== INSTRUCTOR =====
    if (role === "instructor") {
      if (
        includesAny(msg, [
          "students",
          "how many students",
          "total students",
          "student count",
          "كام طالب",
          "عدد الطلاب",
          "الطلاب",
          "عندي كام طالب",
        ])
      ) {
        return `You currently have ${data.totalEnrolledStudents ?? 0} enrolled students across your classes.`;
      }

      if (
        includesAny(msg, [
          "today",
          "today classes",
          "today schedule",
          "classes today",
          "محاضرات النهارده",
          "عندي كام محاضرة النهارده",
          "جدولي النهارده",
          "النهارده",
        ])
      ) {
        return getTodayClassesText(data.todayInstructorClasses, false);
      }

      if (
        includesAny(msg, [
          "attendance",
          "average attendance",
          "avg attendance",
          "attendance rate",
          "متوسط الحضور",
          "الحضور",
          "نسبة الحضور",
        ])
      ) {
        const rate = data.instructorAttendanceRate ?? 0;
        return `Your average attendance is ${rate}%.`;
      }

      if (
        includesAny(msg, [
          "sessions",
          "sessions this week",
          "this week sessions",
          "كام session",
          "عدد السيشنز",
          "عدد المحاضرات",
          "السيشنز",
        ])
      ) {
        return `You have ${data.sessionsThisWeek ?? 0} recorded sessions this week.`;
      }

      if (
        includesAny(msg, [
          "all classes",
          "my classes",
          "classes",
          "كل الكلاسات",
          "كل المواد",
          "كلاساتي",
          "المواد",
        ])
      ) {
        return getWeeklyClassesText(data.instructorClasses, false);
      }

      if (
        includesAny(msg, [
          "recent activity",
          "activity",
          "recent",
          "اخر نشاط",
          "النشاط",
          "التحركات",
        ])
      ) {
        return getActivityFeedText(data.instructorActivityFeed);
      }

      if (
        includesAny(msg, [
          "advice",
          "recommendation",
          "suggestion",
          "نصيحه",
          "اقتراح",
        ])
      ) {
        const rate = data.instructorAttendanceRate ?? 0;
        if (rate >= 85) {
          return "Your attendance level is strong. Keep monitoring sessions and student engagement.";
        }
        if (rate >= 70) {
          return "Attendance is fair, but you may want to encourage students more consistently.";
        }
        return "Attendance is low. You may need to review lecture timing or remind students more actively.";
      }

      return "I didn’t fully understand.\nTry asking about:\n- students\n- today’s classes\n- average attendance\n- sessions this week\n- all classes\n- recent activity";
    }

    return "Dashboard assistant is not available for this role.";
  };

  const sendMessage = (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      sender: "user",
      text: messageText,
    };

    const botMessage = {
      sender: "bot",
      text: getBotReply(messageText),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text:
          role === "student"
            ? "Chat cleared. Ask me again about your attendance, schedule, or classes."
            : "Chat cleared. Ask me again about your students, classes, or attendance.",
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
                {role === "student" ? <FaUserGraduate /> : <FaChalkboardTeacher />}
              </div>
              <div>
                <h4>AI Assistant</h4>
                <p>{role === "student" ? "Student Helper" : "Instructor Helper"}</p>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                className="chat-header-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
                title="Expand"
              >
                <FaExpandAlt />
              </button>

              <button
                className="chat-header-btn"
                onClick={clearChat}
                title="Clear Chat"
              >
                <FaTrash />
              </button>

              <button
                className="chat-header-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
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
                className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
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
                if (e.key === "Enter") sendMessage();
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