// ---------------------------------------------------------------------------
// Central mock data source for the Smart Mess Attendance demo.
// Everything here is generated deterministically (seeded) so the UI is
// stable across reloads, but feels like real production data.
// ---------------------------------------------------------------------------

const COURSES = ["B.A. English","B.A. History","B.A. Economics","B.A. Psychology","B.Sc Physics","B.Sc Chemistry","B.Sc Mathematics","B.Com Accounts","BCA","M.A. Hindi"];
const HOSTELS = ["Vaidehi Hostel","Mahila Hostel"];
const YEARS = ["1st Year","2nd Year","3rd Year","4th Year"];

// simple seeded RNG so data is stable across reloads
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240601);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

export const TOTAL_STUDENTS = 0;

// Student records must come from the backend. Do not expose generated/demo students in the website.
export const students = [];

export const getStudentById = (id) => students.find((s) => s.id === Number(id));

// ---------------------------------------------------------------------------
// Attendance remains empty until real backend records are loaded.
// ---------------------------------------------------------------------------
const MEALS = ["Breakfast", "Lunch", "Dinner"];

export const attendanceHistory = [];

// ---------------------------------------------------------------------------
// Meal configuration
// ---------------------------------------------------------------------------
export const meals = [
  { id: "breakfast", name: "Breakfast", icon: "Coffee", time: "7:30 AM - 9:30 AM", enabled: true, color: "#F59E0B" },
  { id: "lunch", name: "Lunch", icon: "UtensilsCrossed", time: "12:30 PM - 2:30 PM", enabled: true, color: "#2563EB" },
  { id: "dinner", name: "Dinner", icon: "Moon", time: "7:30 PM - 9:30 PM", enabled: true, color: "#7C3AED" },
];

export const mealAttendanceToday = {
  Breakfast: 0,
  Lunch: 0,
  Dinner: 0,
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = [
  { id: 1, type: "announcement", title: "Mess menu updated for July", body: "Special South Indian menu added on weekends starting this week.", time: "2 hours ago", unread: true },
  { id: 2, type: "reminder", title: "Dinner scanning closes in 30 mins", body: "Please complete your dinner scan before 9:30 PM.", time: "3 hours ago", unread: true },
  { id: 3, type: "holiday", title: "Mess closed on Independence Day", body: "Only breakfast will be served on 15th August.", time: "1 day ago", unread: false },
  { id: 4, type: "announcement", title: "QR reissue drive for 3rd years", body: "Students who lost QR access can regenerate from the portal.", time: "2 days ago", unread: false },
  { id: 5, type: "reminder", title: "Feedback survey open", body: "Share your feedback on hostel mess quality this month.", time: "3 days ago", unread: false },
  { id: 6, type: "holiday", title: "Weekend brunch schedule", body: "Breakfast and lunch merged into brunch on Sundays.", time: "5 days ago", unread: false },
];

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------
const ACTIONS = [
  "Logged in to admin portal", "Generated QR for student", "Disabled student account",
  "Exported attendance report", "Updated meal timing", "Regenerated QR batch",
  "Marked scanner offline", "Approved bulk QR print", "Updated hostel details", "Reset admin password",
];
const DEVICES = ["Chrome / Windows", "Safari / macOS", "Edge / Windows", "Chrome / Android", "Scanner Unit #3", "Scanner Unit #1"];

export const auditLogs = Array.from({ length: 80 }, (_, i) => {
  const daysAgo = randInt(0, 20);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randInt(6, 22), randInt(0, 59));
  return {
    id: i + 1,
    action: pick(ACTIONS),
    admin: pick(["Admin Priya", "Admin Raj", "Admin Sana", "System"]),
    device: pick(DEVICES),
    date: date.toISOString(),
    status: rng() > 0.1 ? "Success" : "Failed",
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

// ---------------------------------------------------------------------------
// Dashboard derived stats
// ---------------------------------------------------------------------------
export const dashboardStats = {
  totalStudents: TOTAL_STUDENTS,
  todayAttendance: 0,
  breakfast: mealAttendanceToday.Breakfast,
  lunch: mealAttendanceToday.Lunch,
  dinner: mealAttendanceToday.Dinner,
  absent: 0,
  duplicateAttempts: 0,
  scannerStatus: "Online",
  onlineUsers: 11,
};

export const weeklyAttendanceTrend = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, present: 0, absent: 0 }));

export const mealDistribution = [
  { name: "Breakfast", value: mealAttendanceToday.Breakfast, color: "#F59E0B" },
  { name: "Lunch", value: mealAttendanceToday.Lunch, color: "#2563EB" },
  { name: "Dinner", value: mealAttendanceToday.Dinner, color: "#7C3AED" },
];

export const hostelDistribution = HOSTELS.map((h) => ({
  name: h,
  students: students.filter((s) => s.hostel === h).length,
}));

export const courseDistribution = COURSES.map((c) => ({
  name: c,
  value: students.filter((s) => s.course === c).length,
}));

export const monthlyAttendance = [
  { month: "Jan", percent: 88 }, { month: "Feb", percent: 91 }, { month: "Mar", percent: 85 },
  { month: "Apr", percent: 93 }, { month: "May", percent: 89 }, { month: "Jun", percent: 94 },
  { month: "Jul", percent: 90 },
];

export const HOSTEL_LIST = HOSTELS;
export const COURSE_LIST = COURSES;
export const YEAR_LIST = YEARS;
export const MEAL_LIST = MEALS;

// ---------------------------------------------------------------------------
// Mess fee payment management
// ---------------------------------------------------------------------------
export const paymentConfig = {
  monthlyFee: 3200,
  dueDay: 10,
  gracePeriodDays: 5,
  lateFinePerMonth: 250,
  receiptPrefix: "MMC-MESS",
  academicSession: "2026-27",
  gatewayEnabled: true,
  cashEnabled: true,
  bankTransferEnabled: true,
  taxPercent: 0,
  hostelWiseFee: [
    { hostel: "Vaidehi Hostel", amount: 3200 },
    { hostel: "Mahila Hostel", amount: 3100 },
  ],
  gateways: [
    { id: "razorpay", name: "Razorpay", enabled: true, settlement: "T+1" },
    { id: "ccavenue", name: "CCAvenue", enabled: true, settlement: "T+2" },
    { id: "bank", name: "Bank Transfer", enabled: true, settlement: "Manual" },
    { id: "cash", name: "Cash", enabled: true, settlement: "Admin Entry" },
  ],
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July"];
const PAYMENT_MODES = ["Razorpay", "CCAvenue", "Bank Transfer", "Cash"];
function makePaymentRecord(student, monthIndex, status) {
  const month = MONTHS[monthIndex];
  const fee = student.hostel === "Mahila Hostel" ? 3100 : 3200;
  const isPaid = status === "Paid";
  const isOverdue = status === "Overdue";
  const fine = isOverdue ? paymentConfig.lateFinePerMonth * Math.max(1, 7 - monthIndex) : 0;
  const paidDay = String(randInt(3, 18)).padStart(2, "0");
  const paymentMode = isPaid ? pick(PAYMENT_MODES) : "-";
  const transactionId = isPaid ? `TXN${String(2026070000 + student.id * 13 + monthIndex).padStart(10, "0")}` : "-";
  const receiptNo = isPaid ? `${paymentConfig.receiptPrefix}-${String(26070000 + student.id * 10 + monthIndex)}` : "-";
  return {
    id: `${student.id}-${monthIndex + 1}`,
    studentId: student.id,
    studentName: student.name,
    photo: student.photo,
    regNumber: student.regNumber,
    rollNumber: student.rollNumber,
    mobile: student.mobile,
    course: student.course,
    year: student.year,
    hostel: student.hostel,
    room: student.room,
    month,
    yearLabel: "2026",
    academicSession: paymentConfig.academicSession,
    amount: fee,
    fine,
    total: fee + fine,
    dueDate: `2026-${String(monthIndex + 1).padStart(2, "0")}-${String(paymentConfig.dueDay).padStart(2, "0")}`,
    paymentDate: isPaid ? `2026-${String(monthIndex + 1).padStart(2, "0")}-${paidDay}` : "",
    paymentMode,
    transactionId,
    receiptNo,
    gateway: paymentMode,
    status,
    daysOverdue: isOverdue ? randInt(8, 46) : 0,
    approvalStatus: paymentMode === "Cash" ? "Approved" : "Auto Verified",
    gatewayResponse: isPaid ? "captured" : "awaiting_payment",
    auditTrail: isPaid ? ["Order created", "Gateway callback verified", "Receipt generated"] : ["Invoice generated"],
  };
}

export const messFeePayments = students.flatMap((student) => {
  const records = [];
  for (let monthIndex = 0; monthIndex < MONTHS.length; monthIndex += 1) {
    let status = "Paid";
    if (monthIndex === 6) {
      const marker = student.id % 5;
      status = marker === 0 ? "Overdue" : marker === 1 || marker === 2 ? "Pending" : "Paid";
    } else if (monthIndex === 5 && student.id % 11 === 0) {
      status = "Overdue";
    } else if (monthIndex === 4 && student.id % 17 === 0) {
      status = "Pending";
    }
    records.push(makePaymentRecord(student, monthIndex, status));
  }
  return records;
});

export const getStudentPaymentRecords = (studentId) =>
  messFeePayments
    .filter((payment) => payment.studentId === Number(studentId))
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

export const getStudentPaymentSummary = (studentId) => {
  const records = getStudentPaymentRecords(studentId);
  const unpaid = records.filter((record) => record.status !== "Paid");
  const paid = records.filter((record) => record.status === "Paid");
  const current = records.find((record) => record.month === "July") || records[0];
  const pendingAmount = unpaid.reduce((sum, record) => sum + record.amount, 0);
  const lateFine = unpaid.reduce((sum, record) => sum + record.fine, 0);
  return {
    current,
    paid,
    unpaid,
    totalPaid: paid.reduce((sum, record) => sum + record.total, 0),
    previousDue: unpaid.filter((record) => record.month !== current?.month).reduce((sum, record) => sum + record.amount, 0),
    pendingAmount,
    lateFine,
    totalOutstanding: pendingAmount + lateFine,
    lastPayment: paid[0],
    nextDueDate: current?.status === "Paid" ? "2026-08-10" : current?.dueDate,
  };
};

export const paymentAnalytics = (() => {
  const currentMonth = messFeePayments.filter((payment) => payment.month === "July");
  const paid = currentMonth.filter((payment) => payment.status === "Paid");
  const pending = currentMonth.filter((payment) => payment.status === "Pending");
  const overdue = currentMonth.filter((payment) => payment.status === "Overdue");
  const today = paid.filter((payment) => payment.paymentDate === "2026-07-06");
  const allPaid = messFeePayments.filter((payment) => payment.status === "Paid");
  return {
    totalStudents: students.length,
    paidStudents: paid.length,
    pendingStudents: pending.length,
    overdueStudents: overdue.length,
    todayCollection: today.reduce((sum, payment) => sum + payment.total, 0) || 38400,
    monthlyCollection: paid.reduce((sum, payment) => sum + payment.total, 0),
    totalOutstanding: currentMonth.filter((payment) => payment.status !== "Paid").reduce((sum, payment) => sum + payment.total, 0),
    totalRevenue: allPaid.reduce((sum, payment) => sum + payment.total, 0),
    collectionPercent: currentMonth.length ? Math.round((paid.length / currentMonth.length) * 100) : 0,
  };
})();

export const monthlyCollectionTrend = MONTHS.map((month) => {
  const rows = messFeePayments.filter((payment) => payment.month === month);
  return {
    month: month.slice(0, 3),
    collection: rows.filter((payment) => payment.status === "Paid").reduce((sum, payment) => sum + payment.total, 0),
    outstanding: rows.filter((payment) => payment.status !== "Paid").reduce((sum, payment) => sum + payment.total, 0),
  };
});

export const paymentGatewayUsage = PAYMENT_MODES.map((mode) => ({
  name: mode,
  value: messFeePayments.filter((payment) => payment.paymentMode === mode).length,
}));

export const hostelCollection = HOSTELS.map((hostel) => {
  const rows = messFeePayments.filter((payment) => payment.hostel === hostel && payment.status === "Paid");
  return { name: hostel, collection: rows.reduce((sum, payment) => sum + payment.total, 0) };
});

export const courseCollection = COURSES.map((course) => {
  const rows = messFeePayments.filter((payment) => payment.course === course && payment.status === "Paid");
  return { name: course, collection: rows.reduce((sum, payment) => sum + payment.total, 0) };
});

export const reminderHistory = messFeePayments
  .filter((payment) => payment.status !== "Paid")
  .slice(0, 18)
  .map((payment, index) => ({
    id: index + 1,
    studentName: payment.studentName,
    regNumber: payment.regNumber,
    channel: index % 3 === 0 ? "Email" : index % 3 === 1 ? "Dashboard" : "Email + Dashboard",
    status: index % 4 === 0 ? "Scheduled" : "Sent",
    date: `2026-07-${String(2 + (index % 5)).padStart(2, "0")}`,
  }));
