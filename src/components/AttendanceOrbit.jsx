import { Check, QrCode, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
export default function AttendanceOrbit() {
  return (
    <div className="attendance-orbit" aria-hidden="true">
      <div className="orbit-ring ring-one" />
      <div className="orbit-ring ring-two" />
      <div className="orbit-spark spark-one">
        <Sparkles size={20} />
      </div>
      <div className="orbit-spark spark-two">
        <ShieldCheck size={21} />
      </div>
      <div className="orbit-pass">
        <div className="orbit-pass-head">
          <span className="orbit-avatar" />
          <span>
            <i />
            <i />
          </span>
          <span className="orbit-live" />
        </div>
        <div className="orbit-qr">
          <QrCode size={100} strokeWidth={1.15} />
          <span className="orbit-scan" />
        </div>
        <div className="orbit-pass-foot">
          <ShieldCheck size={11} /> YOUR SECURE MEAL PASS
        </div>
      </div>
      <div className="orbit-chip chip-top">
        <ScanLine size={16} />
        <span>One scan. One check-in.</span>
      </div>
      <div className="orbit-chip chip-bottom">
        <span className="orbit-check">
          <Check size={14} />
        </span>
        Made for your everyday.
      </div>
      <div className="orbit-dots">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
