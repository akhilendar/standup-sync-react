
// Standups page: Improve content and style, remove admin/next standup info.
import React from "react";
import AppNavbar from "@/components/AppNavbar";
import "./Attendance.css"; // Leverage the global table/card/banner CSS for visual consistency

export default function Standups() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(120deg, #e6eafc 0%, #c8eafc 50%, #f1f4f9 100%)" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card-style" style={{ maxWidth: 520 }}>
          <h1 style={{ marginBottom: 13 }}>Team Standups</h1>
          <div className="banner" style={{ color: "#088", marginTop: 0, background: "linear-gradient(90deg,#eefff9 0%,#e8f5fa 80%)" }}>
            Welcome to the team standup page&nbsp;🎤
          </div>
          <div style={{ marginTop: 22, color: "#155a84", lineHeight: 1.7, fontWeight: 500, fontSize: "1.07rem"}}>
            <p>
              This page lets you track your daily standup meetings and team attendance.
              Standups help everyone stay accountable and aligned, improving overall collaboration. 
              If you're an admin, you can schedule standups and monitor team participation. 
              Employees can review their attendance history and stay on top of important updates.
            </p>
            <ul style={{ marginTop: 17, marginLeft: 20, color: "#1d7b64", fontWeight: 600 }}>
              <li>⏰ View all scheduled standups in one place</li>
              <li>✅ See your attendance status for recent standups</li>
              <li>📅 Keep your team on track and connected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
