import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BarChart3, Bell, CheckCircle2, CreditCard, Download,
  FileSpreadsheet, FileText, IndianRupee, Printer,
  Search, Settings2, Users, Wallet, CalendarPlus, ExternalLink,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import Modal from "../components/Modal";
import { apiRequest } from "../lib/api";
import { HOSTEL_LIST } from "../data/mockData";

const money = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#7C3AED", "#0EA5E9"];

function StatusChip({ status }) {
  const styles = {
    Paid: "bg-green-50 text-success border-green-100",
    Pending: "bg-amber-50 text-warning border-amber-100",
    Overdue: "bg-red-50 text-danger border-red-100",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>{status?.toUpperCase()}</span>;
}

function ToolbarButton({ icon: Icon, children, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl2 bg-white border border-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-primary-100 hover:text-primary">
      <Icon size={15} /> {children}
    </button>
  );
}

function ManualPaymentModal({ invoice, onClose, onSaved }) {
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({amount:Number(invoice.amount||0)+Number(invoice.fine||0),payment_date:new Date().toISOString().slice(0,10),payment_mode:"Cash",transaction_id:"",remarks:"",receipt_url:""});
  const set=(name,value)=>setForm((prev)=>({...prev,[name]:value}));
  const submit=async(event)=>{event.preventDefault();if(!form.transaction_id.trim())return toast.error("Reference / transaction number is required");if(Number(form.amount)<=0)return toast.error("Enter a valid amount");setSaving(true);try{await apiRequest("/admin/payments/mark-paid",{method:"POST",body:JSON.stringify({invoice_id:invoice.id,...form,amount:Number(form.amount),remarks:form.remarks||null,receipt_url:form.receipt_url||null})});toast.success("Manual payment recorded and audited");onSaved();}catch(error){toast.error(error.message);}finally{setSaving(false);}};
  const inputClass="mt-1.5 w-full rounded-xl2 border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary-100";
  return <Modal open onClose={onClose} title="Record Manual Payment" width="max-w-2xl"><form onSubmit={submit}><div className="mb-5 rounded-xl2 bg-blue-50 p-4"><p className="font-semibold text-dark">{invoice.student_name}</p><p className="text-xs text-slate-500">{invoice.registration_number} · {invoice.hostel}, Room {invoice.room_number} · {invoice.month} {invoice.year}</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-500">Amount received<input type="number" min="1" value={form.amount} onChange={(e)=>set("amount",e.target.value)} className={inputClass} required/></label><label className="text-xs font-semibold text-slate-500">Payment date<input type="date" value={form.payment_date} onChange={(e)=>set("payment_date",e.target.value)} className={inputClass} required/></label><label className="text-xs font-semibold text-slate-500">Payment mode<select value={form.payment_mode} onChange={(e)=>set("payment_mode",e.target.value)} className={inputClass}><option>Cash</option><option>Bank Transfer</option></select></label><label className="text-xs font-semibold text-slate-500">Reference / transaction number<input value={form.transaction_id} onChange={(e)=>set("transaction_id",e.target.value)} className={inputClass} required/></label><label className="text-xs font-semibold text-slate-500 sm:col-span-2">Receipt URL / file reference<input value={form.receipt_url} onChange={(e)=>set("receipt_url",e.target.value)} className={inputClass} placeholder="Optional receipt link or storage reference"/></label><label className="text-xs font-semibold text-slate-500 sm:col-span-2">Remarks<textarea rows="3" value={form.remarks} onChange={(e)=>set("remarks",e.target.value)} className={inputClass} placeholder="Optional payment remarks"/></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl2 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl2 bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Record Payment"}</button></div></form></Modal>;
}

function PaymentConfiguration({ config, reload }) {
  const [form, setForm] = useState(config || {});

  useEffect(() => {
    setForm(config || {});
  }, [config]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    try {
      await apiRequest("/admin/config", {
        method: "PATCH",
        body: JSON.stringify({
          monthly_fee: Number(form.monthly_fee),
          late_fine: Number(form.late_fine),
          due_day: Number(form.due_day),
          grace_period_days: Number(form.grace_period_days),
          receipt_prefix: form.receipt_prefix,
          academic_session: form.academic_session,
          demo_gateway_enabled: Boolean(form.demo_gateway_enabled),
          razorpay_enabled: Boolean(form.razorpay_enabled),
          ccavenue_enabled: Boolean(form.ccavenue_enabled),
          cash_enabled: Boolean(form.cash_enabled),
          bank_transfer_enabled: Boolean(form.bank_transfer_enabled),
        }),
      });
      toast.success("Payment configuration saved");
      reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const Field = ({ label, name }) => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <input value={form[name] ?? ""} onChange={(e) => set(name, e.target.value)} className="w-full rounded-xl2 bg-slate-50 px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary-100" />
    </div>
  );
  const Toggle = ({ label, name }) => (
    <button type="button" onClick={() => set(name, form[name] ? 0 : 1)} className="flex items-center justify-between rounded-xl2 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`h-6 w-11 rounded-full p-1 ${form[name] ? "bg-success" : "bg-slate-300"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white shadow ${form[name] ? "ml-5" : ""}`} />
      </span>
    </button>
  );

  return (
    <div className="rounded-xl3 bg-white border border-slate-100 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-semibold text-dark">Payment Configuration</h2>
          <p className="text-xs text-slate-400">Super Admin controls for fee rules, gateways, receipt numbering, and offline modes.</p>
        </div>
        <Settings2 size={18} className="text-primary" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Monthly Mess Fee" name="monthly_fee" />
        <Field label="Late Fine" name="late_fine" />
        <Field label="Due Day" name="due_day" />
        <Field label="Grace Period" name="grace_period_days" />
        <Field label="Receipt Prefix" name="receipt_prefix" />
        <Field label="Academic Session" name="academic_session" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <Toggle label="Enable Demo Gateway" name="demo_gateway_enabled" />
        <Toggle label="Enable Razorpay" name="razorpay_enabled" />
        <Toggle label="Enable CCAvenue" name="ccavenue_enabled" />
        <Toggle label="Enable Bank Transfer" name="bank_transfer_enabled" />
        <Toggle label="Enable Cash Payment" name="cash_enabled" />
      </div>
      <button onClick={save} className="mt-5 rounded-xl2 bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-floating">Save Configuration</button>
    </div>
  );
}

export default function MessFeeManagement() {
  const { role } = useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [config, setConfig] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [hostel, setHostel] = useState("All");
  const [month, setMonth] = useState("All");
  const [selected, setSelected] = useState([]);
  const [manualInvoice,setManualInvoice]=useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, analyticsData, configData] = await Promise.all([
        apiRequest("/admin/payments"),
        apiRequest("/admin/analytics"),
        apiRequest("/admin/config"),
      ]);
      setRows(paymentsData.payments || []);
      setAnalytics(analyticsData);
      setConfig(configData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hostels = useMemo(() => [...new Set([...HOSTEL_LIST, ...rows.map((row) => row.hostel).filter(Boolean)])], [rows]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const searchable = [row.student_name, row.registration_number, row.admission_number, row.room_number, row.mobile, row.hostel, row.month].join(" ").toLowerCase();
    return searchable.includes(query.toLowerCase())
      && (status === "All" || row.status === status)
      && (hostel === "All" || row.hostel === hostel)
      && (month === "All" || row.month === month);
  }), [rows, query, status, hostel, month]);

  const recentPayments = rows.filter((row) => row.status === "Paid").slice(0, 8);
  const topOutstanding = rows.filter((row) => row.status !== "Paid").slice(0, 8);
  const statusChart = [
    { name: "Paid", value: analytics?.paidStudents || 0 },
    { name: "Pending", value: analytics?.pendingStudents || 0 },
    { name: "Overdue", value: analytics?.overdueStudents || 0 },
  ];
  const hostelChart = hostels.map((item) => ({
    name: item,
    collection: rows.filter((row) => row.hostel === item && row.status === "Paid").reduce((sum, row) => sum + row.amount + row.fine, 0),
  }));

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  const months = useMemo(() => [...new Set(rows.map((row) => row.month).filter(Boolean))], [rows]);

  const downloadCsv = () => {
    const columns=["student_name","registration_number","admission_number","hostel","room_number","month","year","amount","fine","due_date","status","amount_paid","payment_date","payment_mode","transaction_id","receipt_no"];
    const csv=[columns.join(","),...filteredRows.map((row)=>columns.map((key)=>`"${String(row[key]??"").replaceAll('"','""')}"`).join(","))].join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); const link=document.createElement("a"); link.href=url; link.download=`mess-payments-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const extendDueDate = async (invoiceIds) => {
    const eligible=invoiceIds.filter((id)=>rows.find((row)=>row.id===id)?.status!=="Paid");
    if(!eligible.length) return toast.error("Select at least one unpaid invoice");
    const dueDate=window.prompt("New last payment date (YYYY-MM-DD)",new Date(Date.now()+7*86400000).toISOString().slice(0,10)); if(!dueDate)return;
    try{const result=await apiRequest("/admin/payments/extend-due-date",{method:"POST",body:JSON.stringify({invoice_ids:eligible,due_date:dueDate})});toast.success(`Deadline extended for ${result.updated} payment(s)`);setSelected([]);loadData();}catch(error){toast.error(error.message);}
  };

  const sendReminder = async (invoiceId) => {
    try {
      await apiRequest("/admin/reminders", {
        method: "POST",
        body: JSON.stringify({ invoice_id: invoiceId, channel: "Email + Dashboard" }),
      });
      toast.success("Reminder sent");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="rounded-xl3 bg-white border border-slate-100 p-6 text-sm text-slate-500 shadow-soft">Loading backend payment records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark">Mess Fee Management</h1>
          <p className="text-sm text-slate-400 mt-1">Live backend records for collections, pending payments, reminders, reports, and gateway activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={FileText} onClick={() => window.print()}>PDF / Print</ToolbarButton>
          <ToolbarButton icon={FileSpreadsheet} onClick={downloadCsv}>Payment Report</ToolbarButton>
          <ToolbarButton icon={Download} onClick={downloadCsv}>CSV</ToolbarButton>
          <ToolbarButton icon={Printer} onClick={() => window.print()}>Print</ToolbarButton>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Invoices" value={analytics?.totalInvoices || 0} icon={Users} color="primary" />
        <StatCard label="Paid Students" value={analytics?.paidStudents || 0} icon={CheckCircle2} color="success" />
        <StatCard label="Pending Students" value={analytics?.pendingStudents || 0} icon={Wallet} color="warning" />
        <StatCard label="Overdue Students" value={analytics?.overdueStudents || 0} icon={AlertTriangle} color="danger" />
        <StatCard label="Monthly Collection" value={analytics?.monthlyCollection || 0} icon={CreditCard} color="primary" />
        <StatCard label="Total Outstanding" value={analytics?.totalOutstanding || 0} icon={Bell} color="danger" />
        <StatCard label="Collection %" value={analytics?.collectionPercent || 0} suffix="%" icon={BarChart3} color="success" />
        <StatCard label="Configured Fee" value={config?.monthly_fee || 0} icon={IndianRupee} color="dark" />
      </div>

      <div className="rounded-xl3 bg-white border border-slate-100 p-5 shadow-soft">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display font-semibold text-dark">Payment Records</h2>
            <p className="text-xs text-slate-400">Search by student name, registration ID, admission ID, room, mobile, or hostel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search real IDs" className="w-72 rounded-xl2 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary-100" />
            </div>
            <select value={hostel} onChange={(e) => setHostel(e.target.value)} className="rounded-xl2 bg-slate-50 px-3 py-2.5 text-sm outline-none">
              <option>All</option>
              {hostels.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl2 bg-slate-50 px-3 py-2.5 text-sm outline-none">
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl2 bg-slate-50 px-3 py-2.5 text-sm outline-none"><option>All</option>{months.map((item)=><option key={item}>{item}</option>)}</select>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <ToolbarButton icon={CalendarPlus} onClick={() => extendDueDate(selected)}>Extend Payment Last Date</ToolbarButton>
          <ToolbarButton icon={Download} onClick={downloadCsv}>Export Filtered</ToolbarButton>
        </div>

        <div className="overflow-x-auto rounded-xl2 border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? filteredRows.map((row) => row.id) : [])} /></th>
                {["Student", "Hostel / Room", "Payment Month", "Mess Fee", "Due Date", "Outstanding", "Status", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => (
                <tr key={row.id} className={row.status === "Overdue" ? "bg-red-50/35" : "hover:bg-slate-50/70"}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} /></td>
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="flex items-center gap-3"><img src={row.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.student_name)}`} className="h-10 w-10 rounded-full object-cover" alt=""/><div><p className="font-semibold text-dark">{row.student_name}</p><p className="text-xs text-slate-400">ID {row.registration_number} · Adm. {row.admission_number}</p></div></div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.hostel}<p className="text-xs text-slate-400">Room {row.room_number}</p></td>
                  <td className="px-4 py-3">{row.month} {row.year}</td>
                  <td className="px-4 py-3">{money(row.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(row.due_date).toLocaleDateString("en-IN")}<p className={`text-xs ${row.days_until_due<0?"text-red-500":"text-slate-400"}`}>{row.days_until_due<0?`${Math.abs(row.days_until_due)} days overdue`:`${row.days_until_due} days remaining`}</p></td>
                  <td className="px-4 py-3 font-semibold text-dark">{money(row.amount + row.fine)}</td>
                  <td className="px-4 py-3"><StatusChip status={row.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.status !== "Paid" && <button onClick={() => sendReminder(row.id)} className="rounded-lg bg-amber-50 p-2 text-warning" title="Send reminder"><Bell size={14} /></button>}
                      {row.status !== "Paid" && <button onClick={() => setManualInvoice(row)} className="rounded-lg bg-green-50 p-2 text-success" title="Record manual payment"><CheckCircle2 size={14} /></button>}
                      {row.status !== "Paid" && <button onClick={() => extendDueDate([row.id])} className="rounded-lg bg-blue-50 p-2 text-primary" title="Extend payment last date"><CalendarPlus size={14}/></button>}
                      <button onClick={() => window.print()} className="rounded-lg bg-slate-100 p-2 text-slate-600" title="Print receipt"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl3 bg-white border border-slate-100 p-5 shadow-soft">
          <div className="flex items-center justify-between"><div><h2 className="font-display font-semibold text-dark">Paid Payments / Payment History</h2><p className="text-xs text-slate-400">Verified payment details and receipts</p></div><button onClick={downloadCsv} className="text-xs font-semibold text-primary">Download report</button></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Student","Month","Amount Paid","Payment Date","Mode / Reference","Receipt","Status"].map((x)=><th key={x} className="px-3 py-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-50">{recentPayments.map((payment)=><tr key={payment.id}><td className="px-3 py-3 min-w-[180px]"><p className="font-semibold text-dark">{payment.student_name}</p><p className="text-xs text-slate-400">{payment.registration_number}</p></td><td className="px-3 py-3 whitespace-nowrap">{payment.month} {payment.year}</td><td className="px-3 py-3 font-semibold">{money(payment.amount_paid ?? payment.amount+payment.fine)}</td><td className="px-3 py-3 whitespace-nowrap">{payment.payment_date?new Date(payment.payment_date).toLocaleString("en-IN"):"—"}</td><td className="px-3 py-3"><p>{payment.payment_mode||"—"}</p><p className="text-xs text-slate-400">{payment.transaction_id||"—"}</p></td><td className="px-3 py-3"><p className="text-xs">{payment.receipt_no||"—"}</p>{payment.receipt_url&&<a href={payment.receipt_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">View Receipt <ExternalLink size={11}/></a>}</td><td className="px-3 py-3"><StatusChip status={payment.status}/></td></tr>)}</tbody></table>{recentPayments.length===0&&<p className="py-8 text-center text-sm text-slate-400">No paid backend invoices yet.</p>}</div>
        </div>

        <div className="rounded-xl3 bg-white border border-slate-100 p-5 shadow-soft">
          <h2 className="font-display font-semibold text-dark">Outstanding Students</h2>
          <div className="mt-4 space-y-3">
            {topOutstanding.length === 0 && <p className="text-sm text-slate-400">No outstanding backend invoices.</p>}
            {topOutstanding.map((payment, index) => (
              <div key={payment.id} className="rounded-xl2 border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-dark">{payment.student_name}</p>
                  <span className={`text-xs font-semibold ${index < 3 ? "text-danger" : "text-warning"}`}>P{index + 1}</span>
                </div>
                <p className="text-xs text-slate-400">{payment.registration_number} - {payment.month}</p>
                <p className="font-display text-xl font-semibold text-dark mt-2">{money(payment.amount + payment.fine)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Pending vs Paid" subtitle={`${analytics?.collectionPercent || 0}% collection completion`}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {statusChart.map((entry, index) => <Cell key={entry.name} fill={COLORS[index + 1]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hostel-wise Collection" subtitle="Backend revenue collected by hostel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hostelChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 12, border: "1px solid #EEF2F7", fontSize: 13 }} />
              <Bar dataKey="collection" fill="#22C55E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {role === "super-admin" && <PaymentConfiguration config={config} reload={loadData} />}
      {manualInvoice&&<ManualPaymentModal invoice={manualInvoice} onClose={()=>setManualInvoice(null)} onSaved={()=>{setManualInvoice(null);loadData();}}/>}
    </div>
  );
}
