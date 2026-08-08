import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, CheckCircle2, Coffee, UtensilsCrossed, Moon, UserX, Wifi,
  CalendarDays, Download, Bell, ShieldCheck, CreditCard, IndianRupee, ReceiptText,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import NotificationCard from "../components/NotificationCard";
import DynamicStudentQR from "../components/DynamicStudentQR";
import MealMenuSummary from "../components/MealMenuSummary";
import {
  dashboardStats, weeklyAttendanceTrend, mealDistribution, hostelDistribution,
  attendanceHistory, notifications, students, paymentAnalytics, getStudentPaymentSummary,
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";

export default function Dashboard() {
  const { clock, role, currentMeal, currentStudentId } = useApp();
  const [backendStudent, setBackendStudent] = useState(null);
  const [backendPayment, setBackendPayment] = useState(null);
  useEffect(() => {
    if (role !== "student") return;
    Promise.all([apiRequest("/student/me"), apiRequest("/payments/me")])
      .then(([studentData, paymentData]) => {
        setBackendStudent({
          ...studentData,
          photo: studentData.photo_url,
          rollNumber: studentData.admission_number,
          regNumber: studentData.registration_number,
          room: studentData.room_number,
          year: [studentData.academic_year, studentData.semester].filter(Boolean).join(" / "),
          attendancePercent: 0,
          qrIssued: true,
        });
        setBackendPayment({
          current: paymentData.current,
          nextDueDate: paymentData.current?.due_date,
          totalOutstanding: paymentData.summary?.totalOutstanding || 0,
        });
      })
      .catch((error) => console.error("[StudentDashboard] backend data failed", error));
  }, [role]);
  const hour = clock.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const student = backendStudent || students.find((item) => item.id === currentStudentId) || null;
  const studentAttendance = student ? attendanceHistory.filter((item) => item.studentId === student.id).slice(0, 5) : [];
  const studentPayment = backendPayment || (student ? getStudentPaymentSummary(student.id) : null);
  const basePath = role === "super-admin" ? "/super-admin" : role === "student" ? "/student" : "/admin";

  if (role === "super-admin") {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl3 bg-white border border-blue-100 p-6 md:p-8 shadow-floating"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p className="text-blue-600 text-sm font-semibold">{greeting}, Dr. Ananya Rao</p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 text-dark">Magadh Mahila College Mess Command Center</h1>
              <p className="text-slate-500 mt-3 max-w-2xl">
                Executive overview across Vaidehi Hostel and Mahila Hostel, QR security, live attendance, scanner health, and audit activity.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              {[
                ["System Health", "99.98%"],
                ["Live Scanners", "12/12"],
                ["Admins", "30"],
                ["Hostels", "2"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl2 bg-white/80 border border-blue-100 p-4 shadow-soft">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-display text-xl font-semibold mt-1 text-dark">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Total Students", dashboardStats.totalStudents, Users],
            ["Today's Attendance", dashboardStats.todayAttendance, CheckCircle2],
            ["Breakfast", dashboardStats.breakfast, Coffee],
            ["Lunch", dashboardStats.lunch, UtensilsCrossed],
            ["Dinner", dashboardStats.dinner, Moon],
            ["Total Hostels", 2, Wifi],
            ["Total Admins", 30, ShieldCheck],
            ["Scanner Status", 12, Wifi],
            ["Live Attendance", 83, CalendarDays],
            ["System Alerts", 2, Bell],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl3 bg-white border border-blue-100 p-4 shadow-soft">
              <div className="w-10 h-10 rounded-xl2 bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <p className="text-xs text-slate-500 mt-4">{label}</p>
              <p className="font-display text-2xl font-semibold mt-1 text-dark">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl3 bg-white p-5 text-dark shadow-soft">
            <h2 className="font-display font-semibold">Attendance Trend</h2>
            <p className="text-xs text-slate-400 mb-4">Present vs absent across the week</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyAttendanceTrend}>
                <defs>
                  <linearGradient id="executivePresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
                <Area type="monotone" dataKey="present" stroke="#06B6D4" strokeWidth={3} fill="url(#executivePresent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl3 bg-white p-5 text-dark shadow-soft">
            <h2 className="font-display font-semibold">Meal Statistics</h2>
            <p className="text-xs text-slate-400 mb-4">Today's meal distribution</p>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={mealDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={4}>
                  {mealDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl3 bg-white p-5 text-dark shadow-soft">
            <h2 className="font-display font-semibold">Hostel Comparison</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hostelDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
                <Bar dataKey="students" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl3 bg-white p-5 text-dark shadow-soft">
            <h2 className="font-display font-semibold">Executive Actions</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {["Create Admin", "Backup Database", "QR Security", "College Settings"].map((item) => (
                <Link key={item} to={`${basePath}/settings`} className="rounded-xl2 border border-slate-100 bg-slate-50 p-4 text-sm font-semibold hover:border-primary-100 hover:text-primary">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "student") {
    if (!student) return <div className="rounded-xl3 border border-sky-100 bg-white p-8 text-center shadow-soft"><h1 className="font-display text-xl font-semibold text-dark">No student data available</h1><p className="mt-2 text-sm text-slate-500">Ask the administrator to add and link your real student record.</p></div>;
    return (
      <div className="space-y-6">
        <DynamicStudentQR student={student} />
        <MealMenuSummary />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl3 bg-white border border-sky-100 p-6 md:p-8 text-dark shadow-floating"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-cyan-50" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <img src={student.photo} alt={student.name} className="w-24 h-24 rounded-xl3 bg-white ring-4 ring-white/20" />
            <div className="flex-1">
              <p className="text-sky-600 text-sm font-medium">{greeting}, {student.name}</p>
              <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">{student.attendancePercent}% mess attendance</h1>
              <p className="text-slate-500 text-sm mt-2">{student.rollNumber} | {student.regNumber} | {student.course}</p>
              <p className="text-slate-500 text-sm">{student.hostel}, Room {student.room} | {student.year}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <div className="rounded-xl2 bg-white/80 border border-sky-100 p-4 shadow-soft">
                <p className="text-xs text-slate-500">Current Meal</p>
                <p className="font-display text-lg font-semibold">{currentMeal}</p>
              </div>
              <div className="rounded-xl2 bg-white/80 border border-sky-100 p-4 shadow-soft">
                <p className="text-xs text-slate-500">QR Status</p>
                <p className="font-display text-lg font-semibold">{student.qrIssued ? "Active" : "Disabled"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Breakfast This Month" value={24} icon={Coffee} color="warning" />
          <StatCard label="Lunch This Month" value={27} icon={UtensilsCrossed} color="primary" />
          <StatCard label="Dinner This Month" value={25} icon={Moon} color="dark" />
          <StatCard label="Missed Meals" value={6} icon={CalendarDays} color="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl3 bg-white border border-sky-100 p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Upcoming Due Date</p>
                <p className="font-display text-xl font-semibold text-dark mt-1">
                  {studentPayment.nextDueDate ? new Date(studentPayment.nextDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                </p>
              </div>
              <CalendarDays className="text-sky-600" size={22} />
            </div>
          </div>
          <div className="rounded-xl3 bg-white border border-amber-100 p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Outstanding Amount</p>
                <p className="font-display text-xl font-semibold text-dark mt-1">₹{studentPayment.totalOutstanding.toLocaleString("en-IN")}</p>
              </div>
              <IndianRupee className="text-warning" size={22} />
            </div>
          </div>
          <div className="rounded-xl3 border border-sky-100 bg-sky-50 p-5 text-dark shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Payment Method</p>
                <p className="font-display text-xl font-semibold mt-1">Admin Managed</p>
                <p className="mt-1 text-xs text-slate-500">Contact the mess office for payment entry.</p>
              </div>
              <ReceiptText size={22} className="text-sky-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-surface rounded-xl3 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-dark">Recent Attendance</h2>
                <p className="text-xs text-slate-400">Latest QR scans from your mess account</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl2 bg-primary text-white px-3 py-2 text-xs font-semibold">
                <Download size={14} /> Download
              </button>
            </div>
            <div className="space-y-2">
              {studentAttendance.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl2 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl2 bg-primary-50 text-primary flex items-center justify-center">
                      <UtensilsCrossed size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">{item.meal}</p>
                      <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-success">{new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>

          <Link to={`${basePath}/meals`} className="rounded-xl3 border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-soft"><h2 className="font-display font-semibold text-dark">Weekly Meal Menu</h2><p className="mt-2 text-sm text-slate-500">View all seven days of breakfast, lunch, snacks, and dinner.</p><span className="mt-4 inline-block text-sm font-semibold text-sky-600">Open menu →</span></Link>
        </div>

        <ChartCard title="Student Notifications" subtitle="Mess updates and QR notices" action={<Bell size={15} className="text-primary" />}>
          <div className="space-y-2">
            {notifications.slice(0, 4).map((n) => (
              <NotificationCard key={n.id} notif={n} />
            ))}
          </div>
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl3 bg-white border border-blue-100 p-6 md:p-8 text-dark shadow-floating"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-primary text-sm font-medium">{greeting}, Admin Priya</p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">
              {dashboardStats.todayAttendance} students checked in today
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-lg">
              That's {dashboardStats.totalStudents ? Math.round((dashboardStats.todayAttendance / dashboardStats.totalStudents) * 100) : 0}% of your registered hostel strength across Vaidehi Hostel and Mahila Hostel.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`${basePath}/scanner`} className="bg-primary text-white font-semibold text-sm px-5 py-3 rounded-xl2 shadow-lg hover:scale-[1.02] transition-transform">
              Open Live Scanner
            </Link>
            <Link to={`${basePath}/reports`} className="bg-white text-primary font-semibold text-sm px-5 py-3 rounded-xl2 border border-blue-100 hover:bg-blue-50 transition-colors">
              View Reports
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={dashboardStats.totalStudents} icon={Users} color="primary" />
        <StatCard label="Today's Attendance" value={dashboardStats.todayAttendance} icon={CheckCircle2} color="success" trend={4.2} />
        <StatCard label="Today's Collection" value={paymentAnalytics.todayCollection} icon={IndianRupee} color="success" />
        <StatCard label="Pending Students" value={paymentAnalytics.pendingStudents} icon={CreditCard} color="warning" />
        <StatCard label="Breakfast" value={dashboardStats.breakfast} icon={Coffee} color="warning" />
        <StatCard label="Lunch" value={dashboardStats.lunch} icon={UtensilsCrossed} color="primary" />
        <StatCard label="Dinner" value={dashboardStats.dinner} icon={Moon} color="dark" />
        <StatCard label="Absent Today" value={dashboardStats.absent} icon={UserX} color="danger" trend={-2.1} />
      </div>

      <div className="rounded-xl3 bg-white border border-blue-100 p-5 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-dark">Payment Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">
            {paymentAnalytics.overdueStudents} overdue students, {paymentAnalytics.pendingStudents} pending payments, and {paymentAnalytics.collectionPercent}% current-month collection.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`${basePath}/mess-fees`} className="rounded-xl2 bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open Mess Fee Management</Link>
          <Link to={`${basePath}/mess-fees`} className="rounded-xl2 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-warning">Send Reminders</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Weekly Attendance" subtitle="Present vs absent, last 7 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyAttendanceTrend}>
              <defs>
                <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
              <Area type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={2.5} fill="url(#present)" name="Present" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Meal Distribution" subtitle="Today's scans by meal">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mealDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4}>
                {mealDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {mealDistribution.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                {m.name}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Hostel-wise Strength" subtitle="Registered students per hostel" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hostelDistribution} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12, fill: "#334155" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
              <Bar dataKey="students" fill="#2563EB" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Notifications" subtitle="Recent updates" action={<Link to={`${basePath}/notifications`} className="text-xs text-primary font-medium">View all</Link>}>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {notifications.slice(0, 4).map((n) => (
              <NotificationCard key={n.id} notif={n} />
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Latest Attendance" subtitle="Most recent scan events" action={<Link to={`${basePath}/attendance`} className="text-xs text-primary font-medium">View all</Link>}>
        <div className="space-y-1">
          {attendanceHistory.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <img src={a.photo} alt="" className="w-9 h-9 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{a.name}</p>
                <p className="text-xs text-slate-400">{a.rollNumber} · {a.hostel}</p>
              </div>
              <span className="text-xs font-medium text-slate-500">{a.meal}</span>
              <span className="text-xs text-slate-400 w-20 text-right">
                {new Date(a.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
