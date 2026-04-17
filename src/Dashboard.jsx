import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaClipboardList,
  FaBookOpen,
  FaUserCheck,
  FaChalkboardTeacher,
  FaClock,
  FaIdCard,
} from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [instructorClasses, setInstructorClasses] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);

  const [studentAttendanceRate, setStudentAttendanceRate] = useState(0);
  const [instructorAttendanceRate, setInstructorAttendanceRate] = useState(0);

  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  const [studentWeeklyChart, setStudentWeeklyChart] = useState([]);
  const [instructorWeeklyChart, setInstructorWeeklyChart] = useState([]);

  const [studentActivityFeed, setStudentActivityFeed] = useState([]);
  const [instructorActivityFeed, setInstructorActivityFeed] = useState([]);

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const chartDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const todayName = useMemo(() => {
    const today = new Date();
    return dayNames[today.getDay()];
  }, []);

  const shortDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  const normalizeDay = (day) => {
    if (!day) return "";
    return day.trim();
  };

  const toDateSafe = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d;
  };

  const isWithinCurrentWeek = (date) => {
    if (!date) return false;
    const start = getStartOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  };

  const formatFeedTime = (date) => {
    if (!date) return "recently";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const userRole = userData.role || "";
        setRole(userRole);

        const fullName =
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          user.email ||
          "User";

        setDisplayName(fullName);

        // ================= INSTRUCTOR =================
        if (userRole === "instructor") {
          const classesQuery = query(
            collection(db, "classes"),
            where("instructorId", "==", user.uid)
          );
          const classesSnap = await getDocs(classesQuery);

          const classesData = [];

          for (const classDoc of classesSnap.docs) {
            const classData = { id: classDoc.id, ...classDoc.data() };

            const enrollQuery = query(
              collection(db, "enrollments"),
              where("classDocId", "==", classDoc.id)
            );
            const enrollSnap = await getDocs(enrollQuery);

            // ✅ FIX: جمع activity feed للـ enrollments هنا مباشرة
            const activityItemsLocal = [];
            enrollSnap.docs.forEach((d) => {
              const data = d.data();
              const joinedAt = toDateSafe(data.joinedAt);
              if (joinedAt) {
                activityItemsLocal.push({
                  text: `${data.className || classData.name}: new student joined`,
                  date: joinedAt,
                });
              }
            });

            classesData.push({
              ...classData,
              enrolledCount: enrollSnap.size,
              activityItems: activityItemsLocal,
            });
          }

          setInstructorClasses(classesData);

          const totalStudents = classesData.reduce(
            (sum, item) => sum + (item.enrolledCount || 0),
            0
          );
          setTotalEnrolledStudents(totalStudents);

          let allSessions = [];
          let totalAttendanceDocs = 0;
          let totalPossibleAttendance = 0;

          const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
          // ✅ FIX: ابدأ بالـ activity items من الـ enrollments اللي جمعناها فوق
          const activityItems = classesData.flatMap((c) => c.activityItems || []);

          for (const classItem of classesData) {
            // sessions
            const sessionsQuery = query(
              collection(db, "sessions"),
              where("classId", "==", classItem.id)
            );
            const sessionsSnap = await getDocs(sessionsQuery);

            const classSessions = sessionsSnap.docs.map((s) => ({
              id: s.id,
              ...s.data(),
            }));

            allSessions = allSessions.concat(classSessions);

            for (const session of classSessions) {
              const sessionDate = toDateSafe(session.createdAt);

              if (sessionDate && isWithinCurrentWeek(sessionDate)) {
                weeklyCounts[sessionDate.getDay()] += 1;
              }

              if (sessionDate) {
                activityItems.push({
                  text: `${classItem.name}: session started`,
                  date: sessionDate,
                });
              }

              const attendanceQuery = query(
                collection(db, "attendance"),
                where("sessionId", "==", session.id)
              );
              const attendanceSnap = await getDocs(attendanceQuery);

              totalAttendanceDocs += attendanceSnap.size;
              // ✅ FIX: حساب الـ possible attendance صح
              totalPossibleAttendance += classItem.enrolledCount || 0;

              attendanceSnap.docs.forEach((a) => {
                const attData = a.data();
                const attDate =
                  toDateSafe(attData.createdAt) ||
                  toDateSafe(attData.timestamp) ||
                  toDateSafe(attData.date) ||
                  sessionDate;

                if (attDate) {
                  activityItems.push({
                    text: `${attData.studentName || "Student"} attended ${classItem.name}`,
                    date: attDate,
                  });
                }
              });
            }
          }

          const weeklySessionCount = allSessions.filter((s) =>
            isWithinCurrentWeek(toDateSafe(s.createdAt))
          ).length;
          setSessionsThisWeek(weeklySessionCount);

          // ✅ FIX: حساب الـ avg attendance صح
          const avgAttendance =
            totalPossibleAttendance > 0
              ? Math.round((totalAttendanceDocs / totalPossibleAttendance) * 100)
              : 0;

          setInstructorAttendanceRate(avgAttendance);

          setInstructorWeeklyChart(
            chartDays.map((label, index) => ({
              day: label,
              value: weeklyCounts[index],
            }))
          );

          activityItems.sort((a, b) => (b.date || 0) - (a.date || 0));
          setInstructorActivityFeed(activityItems.slice(0, 5));
        }

        // ================= STUDENT =================
        if (userRole === "student") {
          const enrollmentsQuery = query(
            collection(db, "enrollments"),
            where("studentId", "==", user.uid)
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);

          const enrollmentData = enrollmentsSnap.docs.map((enrollmentDoc) => ({
            id: enrollmentDoc.id,
            ...enrollmentDoc.data(),
          }));

          setStudentEnrollments(enrollmentData);

          // ✅ FIX: استخدم classDocId لو موجود، لو لأ استخدم classId
          const classDocIds = enrollmentData
            .map((e) => e.classDocId || e.classId)
            .filter(Boolean);

          let totalSessions = 0;
          let attendedSessions = 0;

          const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
          const activityItems = [];

          enrollmentData.forEach((item) => {
            const joinedAt = toDateSafe(item.joinedAt);
            if (joinedAt) {
              activityItems.push({
                text: `Joined ${item.className}`,
                date: joinedAt,
              });
            }
          });

          for (const classDocId of classDocIds) {
            const sessionsQuery = query(
              collection(db, "sessions"),
              where("classId", "==", classDocId)
            );
            const sessionsSnap = await getDocs(sessionsQuery);

            for (const sessionDoc of sessionsSnap.docs) {
              const sessionData = sessionDoc.data();
              const sessionDate = toDateSafe(sessionData.createdAt);
              totalSessions += 1; // ✅ FIX: بيحسب كل session صح

              const attendanceQuery = query(
                collection(db, "attendance"),
                where("sessionId", "==", sessionDoc.id),
                where("studentId", "==", user.uid)
              );
              const attendanceSnap = await getDocs(attendanceQuery);

              if (!attendanceSnap.empty) {
                attendedSessions += 1; // ✅ FIX: بيحسب الحضور صح

                const firstAttendance = attendanceSnap.docs[0].data();
                const attDate =
                  toDateSafe(firstAttendance.createdAt) ||
                  toDateSafe(firstAttendance.timestamp) ||
                  toDateSafe(firstAttendance.date) ||
                  sessionDate;

                if (attDate && isWithinCurrentWeek(attDate)) {
                  weeklyCounts[attDate.getDay()] += 1; // ✅ FIX: كان += 0 غلط، دلوقتي += 1
                }

                if (attDate) {
                  activityItems.push({
                    text: `Attendance recorded successfully`,
                    date: attDate,
                  });
                }
              }
            }
          }

          // ✅ FIX: حساب الـ attendance rate صح
          const attendanceRate =
            totalSessions > 0
              ? Math.round((attendedSessions / totalSessions) * 100)
              : 0;

          setStudentAttendanceRate(attendanceRate);

          setStudentWeeklyChart(
            chartDays.map((label, index) => ({
              day: label,
              value: weeklyCounts[index],
            }))
          );

          activityItems.sort((a, b) => (b.date || 0) - (a.date || 0));
          setStudentActivityFeed(activityItems.slice(0, 5));
        }
      } catch (error) {
        console.log("Dashboard error:", error);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const todayInstructorClasses = instructorClasses.filter(
    (item) => normalizeDay(item.day) === todayName
  );

  const todayStudentClasses = studentEnrollments.filter(
    (item) => normalizeDay(item.day) === todayName
  );

  const nextInstructorClass = [...todayInstructorClasses].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  )[0];

  const nextStudentClass = [...todayStudentClasses].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  )[0];

  if (loading) {
    return (
      <section className="dashboard-shell">
        <div className="dashboard-loading-card">Loading dashboard...</div>
      </section>
    );
  }

  // ================= STUDENT VIEW =================
  if (role === "student") {
    return (
      <section className="dashboard-shell">
        <div className="dashboard-page-head">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, here's what's happening today.</p>
          </div>

          <div className="dashboard-head-actions">
            <div className="date-pill">
              <FaCalendarAlt />
              <span>{shortDate}</span>
            </div>

            <button
              className="primary-head-btn"
              onClick={() => navigate("/attendance")}
            >
              View Schedule
            </button>
          </div>
        </div>

        <div className="dashboard-stats-grid four-cols">
          <div className="stat-card">
            <div className="stat-top">
              <span>Attendance Rate</span>
              <div className="stat-icon green">
                <FaUserCheck />
              </div>
            </div>
            <h3>{studentAttendanceRate}%</h3>
            <p>Based on recorded attendance</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Joined Classes</span>
              <div className="stat-icon blue">
                <FaCalendarAlt />
              </div>
            </div>
            <h3>{studentEnrollments.length}</h3>
            <p>Active enrollments</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Today&apos;s Classes</span>
              <div className="stat-icon orange">
                <FaBookOpen />
              </div>
            </div>
            <h3>{todayStudentClasses.length}</h3>
            <p>{nextStudentClass ? `Next: ${nextStudentClass.startTime}` : "No classes today"}</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Weekly Attendance</span>
              <div className="stat-icon purple">
                <FaChartLine />
              </div>
            </div>
            <h3>{studentWeeklyChart.reduce((sum, item) => sum + item.value, 0)}</h3>
            <p>Attendance scans this week</p>
          </div>
        </div>

        <div className="dashboard-main-grid">
          <div className="dashboard-large-card">
            <div className="card-head">
              <h3>Attendance Overview</h3>
              <span>This Week</span>
            </div>

            <div className="bar-chart">
              {studentWeeklyChart.map((item) => (
                <div key={item.day} className="bar-item">
                  <div className="bar-value">{item.value}</div>
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(item.value * 28, 12)}px` }}
                  />
                  <div className="bar-label">{item.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-side-stack">
            <div className="dashboard-side-card">
              <div className="card-head">
                <h3>Activity Feed</h3>
              </div>

              <div className="feed-list">
                {studentActivityFeed.length === 0 ? (
                  <div className="empty-dashboard-state">
                    No recent activity found.
                  </div>
                ) : (
                  studentActivityFeed.map((item, index) => (
                    <div key={index} className="feed-item">
                      <span className="feed-dot" />
                      <div>
                        <strong>{item.text}</strong>
                        <p>{formatFeedTime(item.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="quick-card">
              <h3>Quick Access</h3>
              <p>Common tasks for your role.</p>

              <button
                className="quick-action-btn"
                onClick={() => navigate("/my-classes")}
              >
                <FaBookOpen /> Open My Classes
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate("/attendance")}
              >
                <FaClipboardList /> View Attendance
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate("/digital-id")}
              >
                <FaIdCard /> Open Digital ID
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-bottom-card">
          <div className="card-head">
            <h3>Today&apos;s Schedule</h3>
            <span>{todayName}</span>
          </div>

          {todayStudentClasses.length === 0 ? (
            <div className="empty-dashboard-state">
              No lectures scheduled for today.
            </div>
          ) : (
            <div className="schedule-list">
              {todayStudentClasses.map((item) => (
                <div key={item.id} className="schedule-row">
                  <div className="schedule-badge">CLS</div>

                  <div className="schedule-main">
                    <h4>{item.className}</h4>
                    <p>{item.classId}</p>
                  </div>

                  <div className="schedule-time-pill">
                    <FaClock />
                    {item.startTime} - {item.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ================= INSTRUCTOR VIEW =================
  if (role === "instructor") {
    return (
      <section className="dashboard-shell">
        <div className="dashboard-page-head">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, here's what's happening today.</p>
          </div>

          <div className="dashboard-head-actions">
            <div className="date-pill">
              <FaCalendarAlt />
              <span>{shortDate}</span>
            </div>

            <button
              className="primary-head-btn"
              onClick={() => navigate("/classes")}
            >
              Start Class
            </button>
          </div>
        </div>

        <div className="dashboard-stats-grid four-cols">
          <div className="stat-card">
            <div className="stat-top">
              <span>Today&apos;s Classes</span>
              <div className="stat-icon blue">
                <FaChalkboardTeacher />
              </div>
            </div>
            <h3>{todayInstructorClasses.length}</h3>
            <p>{nextInstructorClass ? `Next: ${nextInstructorClass.startTime}` : "No classes today"}</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Students</span>
              <div className="stat-icon purple">
                <FaUsers />
              </div>
            </div>
            <h3>{totalEnrolledStudents}</h3>
            <p>Across your classes</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Avg. Attendance</span>
              <div className="stat-icon orange">
                <FaChartLine />
              </div>
            </div>
            <h3>{instructorAttendanceRate}%</h3>
            <p>Real attendance average</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Sessions This Week</span>
              <div className="stat-icon green">
                <FaClipboardList />
              </div>
            </div>
            <h3>{sessionsThisWeek}</h3>
            <p>Recorded lecture sessions</p>
          </div>
        </div>

        <div className="dashboard-main-grid">
          <div className="dashboard-large-card">
            <div className="card-head">
              <h3>Weekly Activity</h3>
              <span>This Week</span>
            </div>

            <div className="bar-chart">
              {instructorWeeklyChart.map((item) => (
                <div key={item.day} className="bar-item">
                  <div className="bar-value">{item.value}</div>
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(item.value * 28, 12)}px` }}
                  />
                  <div className="bar-label">{item.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-side-stack">
            <div className="dashboard-side-card">
              <div className="card-head">
                <h3>Activity Feed</h3>
              </div>

              <div className="feed-list">
                {instructorActivityFeed.length === 0 ? (
                  <div className="empty-dashboard-state">
                    No recent activity found.
                  </div>
                ) : (
                  instructorActivityFeed.map((item, index) => (
                    <div key={index} className="feed-item">
                      <span className="feed-dot" />
                      <div>
                        <strong>{item.text}</strong>
                        <p>{formatFeedTime(item.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="quick-card">
              <h3>Quick Access</h3>
              <p>Common tasks for your role.</p>

              <button
                className="quick-action-btn"
                onClick={() => navigate("/classes")}
              >
                <FaCalendarAlt /> Manage Classes
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate("/attendance")}
              >
                <FaClipboardList /> View Attendance
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-bottom-card">
          <div className="card-head">
            <h3>Today&apos;s Schedule</h3>
            <span>{todayName}</span>
          </div>

          {todayInstructorClasses.length === 0 ? (
            <div className="empty-dashboard-state">
              No classes scheduled for today.
            </div>
          ) : (
            <div className="schedule-list">
              {todayInstructorClasses.map((item) => (
                <div key={item.id} className="schedule-row">
                  <div className="schedule-badge">CLS</div>

                  <div className="schedule-main">
                    <h4>{item.name}</h4>
                    <p>{item.classId}</p>
                  </div>

                  <div className="schedule-time-pill">
                    <FaClock />
                    {item.startTime} - {item.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-loading-card">
        Unable to load dashboard for this role.
      </div>
    </section>
  );
}

export default Dashboard;