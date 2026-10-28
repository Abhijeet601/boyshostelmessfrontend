import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Upload,
  UserRound,
  Building2,
  KeyRound,
  ClipboardCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
import { applicantRequest, saveApplication } from "../lib/registration";
import { Avatar, Button, Field, Logo } from "../components/ui";

const steps = [
  ["Personal", UserRound],
  ["Academic", GraduationCap],
  ["Hostel", Building2],
  ["Credentials", KeyRound],
  ["Review", ClipboardCheck],
];
const blank = {
  name: "",
  email: "",
  mobile: "",
  admission_number: "",
  registration_number: "",
  course: "",
  department: "",
  academic_year: "",
  semester: "",
  academic_session: "",
  hostel: "",
  room_number: "",
  login_id: "",
  password: "",
  confirm_password: "",
};
export default function Registration() {
  const { config } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resubmit = params.get("resubmit") === "true";
  const [form, setForm] = useState(blank),
    [step, setStep] = useState(0),
    [options, setOptions] = useState(null),
    [photo, setPhoto] = useState(null),
    [photoName, setPhotoName] = useState(""),
    [existingPhoto, setExistingPhoto] = useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [boot, setBoot] = useState(true);
  const heading = useRef(null);
  const load = useCallback(async () => {
    setBoot(true);
    setError("");
    try {
      const choices = await apiRequest("/public/registration", {
        public: true,
      });
      setOptions(choices);
      if (resubmit) {
        const app = await applicantRequest("/registration/status");
        if (app.status !== "REJECTED" || !app.allow_resubmission)
          throw new Error("This application cannot be resubmitted.");
        setForm(
          Object.fromEntries(Object.keys(blank).map((k) => [k, app[k] || ""])),
        );
        setExistingPhoto(app.photo_url);
      } else
        setForm((f) => ({ ...f, academic_session: choices.academic_session }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBoot(false);
    }
  }, [resubmit]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const change = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));
  const field = (key, label, props = {}) => (
    <Field
      key={key}
      label={label}
      value={form[key]}
      onChange={change(key)}
      required
      maxLength={
        ["name", "email"].includes(key)
          ? 150
          : ["academic_year", "semester", "room_number"].includes(key)
            ? 40
            : 120
      }
      {...props}
    />
  );
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG or WebP image up to 3 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setPhotoName(file.name);
      setError("");
    };
    reader.onerror = () => setError("Could not read this photograph.");
    reader.readAsDataURL(file);
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (step === 3 && form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, ...(photo ? { photo_data: photo } : {}) };
      const result = resubmit
        ? await applicantRequest("/registration/resubmit", {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiRequest("/public/registration", {
            public: true,
            method: "POST",
            body: JSON.stringify(payload),
          });
      saveApplication(result.credential);
      navigate("/registration/status", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const strength = [
    form.password.length >= 10,
    /[A-Za-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;
  return (
    <div className="enrollment-screen">
      <header className="enrollment-header">
        <Link to="/login" className="brand">
          <Logo src={config.logo_url} />
          <strong>{config.app_name}</strong>
        </Link>
        <Link to="/login" className="text-link">
          Already registered? Sign in <ArrowRight size={14} />
        </Link>
      </header>
      <div className="enrollment-intro">
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1>
          {resubmit ? "Let’s make it right." : "One account. Every meal."}
        </h1>
        <p className="muted">
          {resubmit
            ? "Update your application and send it for another review."
            : "Join your hostel community. Your administrator will review your details before you sign in."}
        </p>
      </div>
      <div className="enrollment-layout">
        <aside className="enrollment-guide">
          <span className="section-index">01 — 05 / GET STARTED</span>
          <ol className="registration-steps">
            {steps.map(([label, Icon], i) => (
              <li
                key={label}
                className={i === step ? "current" : i < step ? "complete" : ""}
              >
                <button
                  type="button"
                  disabled={i > step || busy || boot}
                  onClick={() => {
                    setStep(i);
                    setError("");
                  }}
                  aria-current={step === i ? "step" : undefined}
                >
                  <span>
                    {i < step ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <small>
                      {i < step
                        ? "Completed"
                        : i === step
                          ? "You are here"
                          : `Step ${i + 1}`}
                    </small>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          <div className="enrollment-assurance">
            <ShieldCheck size={24} />
            <h3>Reviewed by your hostel.</h3>
            <p>
              Your details stay protected. Account access begins after approval.
            </p>
          </div>
          <Link className="text-link" to="/registration/status">
            Check an existing application <ArrowRight size={14} />
          </Link>
        </aside>
        <motion.form
          className="enrollment-card"
          onSubmit={submit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="registration-progress"
            aria-label={`Step ${step + 1} of 5`}
          >
            <motion.span
              animate={{ width: `${(step + 1) * 20}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="step-caption">
            <span>STEP 0{step + 1}</span>
            <span>{Math.round(((step + 1) / 5) * 100)}% complete</span>
          </div>
          <h2 tabIndex={-1} ref={heading}>
            {
              [
                "A little about you",
                "Your academic details",
                "Find your home",
                "Make it yours",
                "Looking good?",
              ][step]
            }
          </h2>
          <p className="muted">
            {
              [
                "Use the details on your institution records.",
                "Help your hostel verify your enrollment.",
                "Choose your assigned hostel and room.",
                "Choose credentials you’ll use after approval.",
                "Review your details before submitting for approval.",
              ][step]
            }
          </p>
          {error && (
            <div className="auth-error" role="alert">
              {error}
              {!options && (
                <Button type="button" variant="ghost" onClick={load}>
                  Try again
                </Button>
              )}
            </div>
          )}
          {boot ? (
            <p role="status">Loading registration options…</p>
          ) : (
            options && (
              <>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.17 }}
                    className="step-content"
                  >
                    {step === 0 && (
                      <>
                        <div className="photo-upload">
                          <Avatar
                            src={photo || existingPhoto}
                            name={form.name}
                            size={68}
                          />
                          <div>
                            <label className="btn btn-outline upload-label">
                              <Upload size={15} />{" "}
                              {photo
                                ? "Change photograph"
                                : "Upload photograph"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={upload}
                              />
                            </label>
                            <small className="muted">
                              {photoName ||
                                "Optional · JPEG, PNG or WebP · up to 3 MB"}
                            </small>
                          </div>
                        </div>
                        {field("name", "Full name", {
                          autoComplete: "name",
                          minLength: 2,
                        })}
                        <div className="form-grid">
                          {field("email", "Email address", {
                            type: "email",
                            autoComplete: "email",
                          })}
                          {field("mobile", "Mobile number", {
                            type: "tel",
                            autoComplete: "tel",
                            pattern: "\\+?[0-9][0-9 \\-]{7,18}[0-9]",
                            maxLength: 20,
                          })}
                        </div>
                      </>
                    )}
                    {step === 1 && (
                      <div className="form-grid">
                        {field("admission_number", "Roll number", {
                          maxLength: 100,
                          minLength: 2,
                        })}
                        {field("registration_number", "Registration number", {
                          maxLength: 100,
                          minLength: 2,
                        })}
                        {field("course", "Course")}
                        {field("department", "Department")}
                        {field("academic_year", "Academic year")}
                        {field("semester", "Semester")}
                        {field("academic_session", "Academic session", {
                          placeholder: "e.g. 2026–2027",
                          maxLength: 80,
                        })}
                      </div>
                    )}
                    {step === 2 && (
                      <>
                        <Field label="Hostel">
                          <select
                            required
                            value={form.hostel}
                            onChange={change("hostel")}
                          >
                            <option value="">Select your hostel</option>
                            {options.hostels.map((h) => (
                              <option key={h}>{h}</option>
                            ))}
                          </select>
                        </Field>
                        {!options.hostels.length && (
                          <div className="notice notice-warning">
                            No hostels are accepting registrations. Contact your
                            institution.
                          </div>
                        )}
                        {field("room_number", "Room number")}
                        <div className="notice">
                          <Building2 size={20} />
                          <span>
                            Your application will be sent to an administrator
                            authorized for this hostel.
                          </span>
                        </div>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        {field("login_id", "Login ID or email", {
                          autoComplete: "username",
                          maxLength: 100,
                          minLength: 2,
                          pattern: "[A-Za-z0-9@._+\\-]+",
                        })}
                        <Field label="Password">
                          <div className="password-wrap">
                            <input
                              required
                              type={show ? "text" : "password"}
                              minLength={10}
                              maxLength={256}
                              autoComplete="new-password"
                              value={form.password}
                              onChange={change("password")}
                              pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,}"
                              title="At least 10 characters including a letter, number and symbol"
                            />
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={
                                show ? "Hide password" : "Show password"
                              }
                              onClick={() => setShow(!show)}
                            >
                              {show ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </Field>
                        <div
                          className="password-strength"
                          aria-label={`Password requirements: ${strength} of 4 satisfied`}
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <span
                              key={n}
                              className={n <= strength ? "filled" : ""}
                            />
                          ))}
                        </div>
                        <p className="muted small">
                          10+ characters with a letter, number and symbol.
                        </p>
                        {field("confirm_password", "Confirm password", {
                          type: show ? "text" : "password",
                          autoComplete: "new-password",
                          maxLength: 256,
                        })}
                      </>
                    )}
                    {step === 4 && (
                      <>
                        <div className="review-person">
                          <Avatar
                            src={photo || existingPhoto}
                            name={form.name}
                            size={60}
                          />
                          <div>
                            <h3>{form.name}</h3>
                            <p className="muted">{form.email}</p>
                          </div>
                        </div>
                        <div className="review-grid">
                          {[
                            ["Mobile", "mobile"],
                            ["Roll number", "admission_number"],
                            ["Registration number", "registration_number"],
                            ["Course", "course"],
                            ["Department", "department"],
                            ["Year / semester", null],
                            ["Academic session", "academic_session"],
                            ["Hostel", "hostel"],
                            ["Room", "room_number"],
                            ["Login ID", "login_id"],
                          ].map(([label, key]) => (
                            <div key={label}>
                              <small>{label}</small>
                              <strong>
                                {key
                                  ? form[key]
                                  : `${form.academic_year} / ${form.semester}`}
                              </strong>
                            </div>
                          ))}
                        </div>
                        <div className="notice">
                          <ShieldCheck size={20} />
                          <span>
                            Your account stays pending until your administrator
                            approves it. You can securely track the application
                            after submitting.
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="enrollment-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      step ? setStep(step - 1) : navigate("/login")
                    }
                  >
                    <ArrowLeft size={15} />
                    {step ? "Back" : "Sign in"}
                  </Button>
                  <Button
                    type="submit"
                    loading={busy}
                    disabled={boot || !options.hostels.length}
                  >
                    {step === 4
                      ? "Submit Registration for Approval"
                      : "Continue"}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </>
            )
          )}
        </motion.form>
      </div>
      <footer className="enrollment-footer">
        <ShieldCheck size={13} /> Protected enrollment ·{" "}
        {config.institution_name || config.app_name}
      </footer>
    </div>
  );
}
