import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { Button, Logo } from "../components/ui";
import AttendanceOrbit from "../components/AttendanceOrbit";
export default function Splash() {
  const { ready, isAuthenticated, basePath, config, bootError, initialize } =
    useApp();
  if (ready && !bootError)
    return (
      <Navigate
        to={isAuthenticated ? `${basePath}/dashboard` : "/login"}
        replace
      />
    );
  return (
    <div className="splash">
      <motion.div
        className="splash-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AttendanceOrbit />
        <Logo size={50} src={config.logo_url} />
        <h1>{config.app_name || "SmartMess"}</h1>
        <p className="muted small">Smart Attendance. Seamless Experience.</p>
        {bootError ? (
          <>
            <p className="auth-error">{bootError}</p>
            <Button onClick={initialize}>Retry connection</Button>
          </>
        ) : (
          <>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Initializing application"
            >
              <div className="progress-fill" />
            </div>
            <p className="muted small">Preparing your workspace</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
