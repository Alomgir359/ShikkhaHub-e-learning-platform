// components/EnrollmentModal.jsx
// Real-world manual payment enrollment:
//   1) Instructions: Send Money to our bKash / Nagad personal number
//   2) Form: name, mobile, email, transaction ID (+ password for a new account)
//   3) Done: "Enrollment complete" → log in; the admin verifies the payment and activates the account
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, formatTaka, isFreeCourse, openAuthModal } from "../utils/courseMeta";

const METHODS = {
  BKASH: {
    key: "BKASH",
    name: "bKash",
    color: "#e2136e",
    light: "bg-pink-50 border-pink-200",
    ussd: "*247#",
    steps: (num, amount) => [
      <>bKash অ্যাপ খুলুন অথবা ডায়াল করুন <b>*247#</b></>,
      <><b>"Send Money"</b> অপশন নির্বাচন করুন</>,
      <>প্রাপকের নম্বর দিন: <b className="font-mono">{num}</b></>,
      <>টাকার পরিমাণ লিখুন: <b>{amount}</b></>,
      <>রেফারেন্সে আপনার মোবাইল নম্বর লিখুন (ঐচ্ছিক)</>,
      <>পিন দিয়ে কনফার্ম করুন — SMS-এ একটি <b>Transaction ID (TrxID)</b> পাবেন</>,
    ],
  },
  NAGAD: {
    key: "NAGAD",
    name: "Nagad",
    color: "#f6921e",
    light: "bg-orange-50 border-orange-200",
    ussd: "*167#",
    steps: (num, amount) => [
      <>Nagad অ্যাপ খুলুন অথবা ডায়াল করুন <b>*167#</b></>,
      <><b>"Send Money"</b> অপশন নির্বাচন করুন</>,
      <>প্রাপকের নম্বর দিন: <b className="font-mono">{num}</b></>,
      <>টাকার পরিমাণ লিখুন: <b>{amount}</b></>,
      <>রেফারেন্সে আপনার মোবাইল নম্বর লিখুন (ঐচ্ছিক)</>,
      <>পিন দিয়ে কনফার্ম করুন — SMS-এ একটি <b>Transaction ID (TxnID)</b> পাবেন</>,
    ],
  },
};

const NAME_RE = /^.{2,100}$/;
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRX_RE = /^[A-Z0-9]{8,12}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

function StepDots({ step, free }) {
  const items = free ? ["তথ্য দিন", "সম্পন্ন"] : ["টাকা পাঠান", "তথ্য দিন", "সম্পন্ন"];
  const index = free ? (step === "form" ? 0 : 1) : step === "pay" ? 0 : step === "form" ? 1 : 2;
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Enrollment steps">
      {items.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span className={`flex items-center justify-center w-6 h-6 rounded-full ${
            i < index ? "bg-green-600 text-white" : i === index ? "bg-yellow-400 text-green-950" : "bg-gray-200 text-gray-500"}`}>
            {i < index ? "✓" : i + 1}
          </span>
          <span className={i === index ? "text-gray-900" : "text-gray-500"}>{label}</span>
          {i < items.length - 1 && <span className="w-5 h-px bg-gray-300" aria-hidden></span>}
        </li>
      ))}
    </ol>
  );
}

export default function EnrollmentModal({ course, open, onClose, onSubmitted }) {
  const navigate = useNavigate();
  const free = isFreeCourse(course);
  const amountText = formatTaka(course?.price);

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  const loggedInStudent = !!userId && userRole === "STUDENT";

  const [step, setStep] = useState(free ? "form" : "pay");
  const [payInfo, setPayInfo] = useState(null);
  const [method, setMethod] = useState("BKASH");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", transactionId: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null); // { code, message }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Reset + prefill every time the modal opens
  useEffect(() => {
    if (!open) return;
    setStep(free ? "form" : "pay");
    setErrors({});
    setServerError(null);
    setResult(null);
    setCopied(false);
    setForm({
      fullName: loggedInStudent ? localStorage.getItem("userName") || "" : "",
      phone: "",
      email: loggedInStudent ? localStorage.getItem("userEmail") || "" : "",
      transactionId: "",
      password: "",
      confirmPassword: "",
    });
    // Logged-in student → fill the phone from the profile (best effort)
    if (loggedInStudent) {
      fetch(`${API_BASE}/teachers/${userId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => p?.phone && setForm((f) => ({ ...f, phone: f.phone || p.phone })))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || free) return;
    fetch(`${API_BASE}/site/payment-info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setPayInfo(d || {});
        if (d && !d.bkashNumber && d.nagadNumber) setMethod("NAGAD");
      })
      .catch(() => setPayInfo({}));
  }, [open, free]);

  // Esc closes; lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, submitting, onClose]);

  const m = METHODS[method];
  const number = method === "BKASH" ? payInfo?.bkashNumber : payInfo?.nagadNumber;
  const availableMethods = useMemo(() => {
    if (!payInfo) return ["BKASH", "NAGAD"];
    const list = [];
    if (payInfo.bkashNumber) list.push("BKASH");
    if (payInfo.nagadNumber) list.push("NAGAD");
    return list.length ? list : ["BKASH", "NAGAD"];
  }, [payInfo]);

  if (!open || !course) return null;

  const copyNumber = async () => {
    if (!number) return;
    try { await navigator.clipboard.writeText(number); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === "transactionId") v = v.toUpperCase().replace(/\s+/g, "");
    if (k === "phone") v = v.replace(/[^\d]/g, "").slice(0, 11);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!NAME_RE.test(form.fullName.trim())) e.fullName = "পূর্ণ নাম লিখুন।";
    if (!PHONE_RE.test(form.phone)) e.phone = "১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)।";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "সঠিক ইমেইল দিন।";
    if (!free && !TRX_RE.test(form.transactionId)) e.transactionId = "SMS-এ পাওয়া ৮–১২ অক্ষরের Transaction ID দিন।";
    if (!loggedInStudent) {
      if (!PASSWORD_RE.test(form.password))
        e.password = "কমপক্ষে ৮ অক্ষর — বড় হাতের, ছোট হাতের অক্ষর, সংখ্যা ও একটি চিহ্ন (@#! ইত্যাদি)।";
      if (form.password !== form.confirmPassword) e.confirmPassword = "পাসওয়ার্ড মিলছে না।";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/enrollments/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          studentId: loggedInStudent ? Number(userId) : null,
          fullName: form.fullName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          password: loggedInStudent ? null : form.password,
          paymentMethod: free ? "FREE" : method,
          transactionId: free ? null : form.transactionId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setResult({ ...data, method, transactionId: form.transactionId, email: form.email.trim() });
        setStep("done");
        onSubmitted && onSubmitted(data.status);
      } else {
        setServerError({ code: data.code, message: data.message || "এনরোলমেন্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।" });
      }
    } catch {
      setServerError({ code: "NETWORK", message: "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।" });
    } finally {
      setSubmitting(false);
    }
  };

  const goLogin = (notice) => {
    onClose();
    openAuthModal("login", { stayOnPage: true, email: form.email.trim(), notice });
  };

  const inputCls = (err) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
      err ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-500"}`;
  const Err = ({ k }) => (errors[k] ? <p className="text-red-600 text-xs mt-1">⚠ {errors[k]}</p> : null);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="enroll-title">
      <div className="bg-white w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">কোর্সে এনরোল করুন</p>
              <h2 id="enroll-title" className="font-bold text-gray-900 leading-snug line-clamp-2">{course.courseTitle}</h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-extrabold text-green-700">{free ? "Free" : amountText}</p>
              {!submitting && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm mt-1" aria-label="Close">✕ বন্ধ</button>
              )}
            </div>
          </div>
          <div className="mt-3"><StepDots step={step} free={free} /></div>
        </div>

        {/* STEP 1 — PAYMENT INSTRUCTIONS */}
        {step === "pay" && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">পেমেন্ট মাধ্যম বেছে নিন</p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {availableMethods.map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 font-bold transition ${
                      method === k ? "border-current shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    style={method === k ? { color: METHODS[k].color } : undefined}>
                    <span className="w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm" style={{ background: METHODS[k].color }}>
                      {METHODS[k].name[0]}
                    </span>
                    {METHODS[k].name}
                    <span className="ml-auto text-[10px] font-semibold text-gray-500">Personal</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number card */}
            <div className={`rounded-2xl border p-4 ${m.light}`}>
              <p className="text-xs text-gray-600">এই {m.name} পার্সোনাল নম্বরে <b>Send Money</b> করুন</p>
              {payInfo === null ? (
                <div className="h-8 mt-2 w-48 bg-white/70 rounded animate-pulse" />
              ) : number ? (
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="font-mono text-2xl md:text-3xl font-extrabold tracking-wider" style={{ color: m.color }}>{number}</span>
                  <button type="button" onClick={copyNumber}
                    className="shrink-0 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                    {copied ? "✓ কপি হয়েছে" : "📋 কপি"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-700">পেমেন্ট নম্বর এখনো যোগ করা হয়নি। অনুগ্রহ করে একটু পরে চেষ্টা করুন।</p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm bg-white/80 rounded-xl px-3 py-2">
                <span className="text-gray-600">পাঠাতে হবে</span>
                <span className="font-extrabold text-gray-900">{amountText}</span>
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">কীভাবে টাকা পাঠাবেন</p>
              <ol className="space-y-2">
                {m.steps(number || "01XXXXXXXXX", amountText).map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: m.color }}>{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
              ⚠️ {payInfo?.note || "অবশ্যই \"Send Money\" করবেন, \"Payment\" বা \"Cash Out\" নয়।"} Transaction ID-টি সংরক্ষণ করুন — পরের ধাপে লাগবে।
              {payInfo?.supportPhone && <> সমস্যা হলে কল/WhatsApp: <b>{payInfo.supportPhone}</b></>}
            </div>

            <button type="button" onClick={() => setStep("form")} disabled={payInfo !== null && !number}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
              টাকা পাঠিয়েছি, পরের ধাপ →
            </button>
          </div>
        )}

        {/* STEP 2 — FORM */}
        {step === "form" && (
          <form onSubmit={submit} noValidate className="p-5 space-y-4">
            {!free && (
              <div className="flex items-center justify-between gap-3 text-sm bg-gray-50 border rounded-xl px-3 py-2">
                <span>
                  <b style={{ color: m.color }}>{m.name}</b> → <span className="font-mono">{number || "—"}</span> · <b>{amountText}</b>
                </span>
                <button type="button" onClick={() => setStep("pay")} className="text-green-700 font-semibold text-xs hover:underline">পরিবর্তন</button>
              </div>
            )}

            {loggedInStudent && (
              <p className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-xl p-3">
                আপনি লগইন করা আছেন — এনরোলমেন্টটি আপনার অ্যাকাউন্টে যোগ হবে।
              </p>
            )}

            {serverError && (
              <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl p-3" role="alert">
                <p>{serverError.message}</p>
                {serverError.code === "ACCOUNT_EXISTS" && (
                  <button type="button" onClick={() => goLogin({ tone: "info", title: "আগে লগইন করুন", text: "লগইন করার পর কোর্স পেজ থেকে আবার \"Enroll now\" চাপুন।" })}
                    className="mt-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">লগইন করুন</button>
                )}
              </div>
            )}

            <div>
              <label htmlFor="en-name" className="block text-sm font-semibold text-gray-700 mb-1">পূর্ণ নাম *</label>
              <input id="en-name" className={inputCls(errors.fullName)} value={form.fullName} onChange={set("fullName")} autoComplete="name" placeholder="যেমন: Rahim Uddin" />
              <Err k="fullName" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="en-phone" className="block text-sm font-semibold text-gray-700 mb-1">মোবাইল নম্বর *</label>
                <input id="en-phone" type="tel" inputMode="numeric" className={inputCls(errors.phone)} value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="01XXXXXXXXX" />
                {!free && !errors.phone && <p className="text-[11px] text-gray-500 mt-1">যে নম্বর থেকে টাকা পাঠিয়েছেন</p>}
                <Err k="phone" />
              </div>
              <div>
                <label htmlFor="en-email" className="block text-sm font-semibold text-gray-700 mb-1">ইমেইল *</label>
                <input id="en-email" type="email" className={inputCls(errors.email)} value={form.email} onChange={set("email")} autoComplete="email"
                  placeholder="you@example.com" readOnly={loggedInStudent} />
                <Err k="email" />
              </div>
            </div>

            {!free && (
              <div>
                <label htmlFor="en-trx" className="block text-sm font-semibold text-gray-700 mb-1">Transaction ID *</label>
                <input id="en-trx" className={`${inputCls(errors.transactionId)} font-mono tracking-widest uppercase`} value={form.transactionId}
                  onChange={set("transactionId")} placeholder={method === "NAGAD" ? "যেমন: 7AB2CD9E" : "যেমন: BHK7XA2Q9P"} maxLength={12} autoComplete="off" />
                {!errors.transactionId && <p className="text-[11px] text-gray-500 mt-1">{m.name} থেকে আসা SMS-এ TrxID লেখা থাকে</p>}
                <Err k="transactionId" />
              </div>
            )}

            {!loggedInStudent && (
              <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">আপনার অ্যাকাউন্টের পাসওয়ার্ড</p>
                  <p className="text-xs text-gray-500">{free ? "এই ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করবেন।" : "অ্যাডমিন অ্যাপ্রুভ করার পর এই ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করবেন।"}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <input type="password" aria-label="Password" className={inputCls(errors.password)} value={form.password} onChange={set("password")} placeholder="পাসওয়ার্ড" autoComplete="new-password" />
                    <Err k="password" />
                  </div>
                  <div>
                    <input type="password" aria-label="Confirm password" className={inputCls(errors.confirmPassword)} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="আবার লিখুন" autoComplete="new-password" />
                    <Err k="confirmPassword" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  আগে থেকে অ্যাকাউন্ট আছে?{" "}
                  <button type="button" onClick={() => goLogin({ tone: "info", title: "লগইন করে এনরোল করুন", text: "লগইন করার পর কোর্স পেজ থেকে আবার \"Enroll now\" চাপুন।" })}
                    className="text-green-700 font-semibold hover:underline">লগইন করুন</button>
                </p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-yellow-400 text-green-950 py-3 rounded-xl font-extrabold hover:bg-yellow-300 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <span className="h-4 w-4 rounded-full border-2 border-green-900 border-t-transparent animate-spin" aria-hidden></span>}
              {submitting ? "জমা হচ্ছে…" : "এনরোলমেন্ট সম্পন্ন করুন"}
            </button>
            <p className="text-[11px] text-center text-gray-500">জমা দেওয়ার পর অ্যাডমিন আপনার পেমেন্ট যাচাই করবেন।</p>
          </form>
        )}

        {/* STEP 3 — DONE */}
        {step === "done" && result && (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">🎉</div>
            <div>
              <h3 className="text-2xl font-extrabold text-green-700">এনরোলমেন্ট সম্পন্ন হয়েছে!</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                {result.requiresApproval
                  ? "আপনার পেমেন্টের তথ্য আমরা পেয়েছি। অ্যাডমিন যাচাই করে অ্যাপ্রুভ করলেই আপনি লগইন করে ক্লাস শুরু করতে পারবেন।"
                  : "আপনি এখন কোর্সে এনরোলড।"}
              </p>
            </div>

            {result.requiresApproval && (
              <>
                <dl className="text-left text-sm bg-gray-50 border rounded-2xl divide-y">
                  {[
                    ["কোর্স", course.courseTitle],
                    ["পরিমাণ", amountText],
                    ["মাধ্যম", METHODS[result.method]?.name],
                    ["Transaction ID", result.transactionId],
                    ["ইমেইল", result.email],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-2">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className={`font-semibold text-gray-900 text-right ${k === "Transaction ID" ? "font-mono" : ""}`}>{v}</dd>
                    </div>
                  ))}
                </dl>

                <ol className="text-left space-y-3">
                  {[
                    { done: true, t: "এনরোলমেন্ট জমা হয়েছে" },
                    { now: true, t: "অ্যাডমিন পেমেন্ট যাচাই করছেন", s: "সাধারণত ২–১২ ঘণ্টা" },
                    { t: loggedInStudent ? "অ্যাপ্রুভ হলে ড্যাশবোর্ডে কোর্স চালু হবে" : "অ্যাপ্রুভ হলে লগইন করে ক্লাস শুরু করুন" },
                  ].map((x, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        x.done ? "bg-green-600 text-white" : x.now ? "bg-amber-400 text-amber-950 animate-pulse" : "bg-gray-200 text-gray-500"}`}>
                        {x.done ? "✓" : i + 1}
                      </span>
                      <span className="text-sm text-gray-800">{x.t}{x.s && <span className="block text-xs text-gray-500">{x.s}</span>}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {loggedInStudent ? (
              <button onClick={() => { onClose(); navigate("/student-dashboard"); }}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                ড্যাশবোর্ডে যান
              </button>
            ) : (
              <button onClick={() => goLogin(result.requiresApproval
                  ? { tone: "info", title: "✅ এনরোলমেন্ট সম্পন্ন হয়েছে", text: "আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন। পেমেন্ট এখনো যাচাই না হলে এখানে তা দেখাবে।" }
                  : { tone: "info", title: "✅ এনরোলমেন্ট সম্পন্ন", text: "আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করে কোর্স শুরু করুন।" })}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                লগইন করুন
              </button>
            )}
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-800">বন্ধ করুন</button>
          </div>
        )}
      </div>
    </div>
  );
}
