// import React from "react";
// import { useAdminAuth } from "@/context/AdminAuthContext";
// import { useNavigate } from "react-router-dom";
// import AppNavbar from "@/components/AppNavbar";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import "./AdminHome.css"; // Standalone admin dashboard tweaks
// // Removed Tailwind imports -- using global CSS now.

// const AdminHome = () => {
//   const { admin, logout } = useAdminAuth();
//   const navigate = useNavigate();
//   const [summary, setSummary] = React.useState<{
//     standupTime: string | null;
//     present: number;
//     total: number;
//   }>({ standupTime: null, present: 0, total: 0 });

//   React.useEffect(() => {
//     if (!admin) navigate("/admin/login");
//   }, [admin, navigate]);

//   React.useEffect(() => {
//     async function fetchSummary() {
//       const todayStr = new Date().toISOString().slice(0, 10);
//       const { data: standup } = await supabase
//         .from("standups")
//         .select("*")
//         .gte("scheduled_at", todayStr + "T00:00:00.000Z")
//         .lt("scheduled_at", todayStr + "T23:59:59.999Z")
//         .order("scheduled_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();
//       let standupTime = null,
//         present = 0,
//         total = 0;
//       if (standup) {
//         const { data: attendance } = await supabase
//           .from("attendance")
//           .select("*")
//           .eq("standup_id", standup.id);
//         present = attendance
//           ? attendance.filter((a) => a.status === "Present").length
//           : 0;
//         total = attendance ? attendance.length : 0;
//         standupTime = new Date(standup.scheduled_at).toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         });
//       }
//       setSummary({ standupTime, present, total });
//     }
//     fetchSummary();
//   }, []);

//   // Handler for redirecting to the standups page
//   const handleScheduleStandup = () => {
//     navigate("/standups");
//   };
//   console.log(summary);

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         padding: 0,
//         margin: 0,
//       }}
//     >
//       <AppNavbar />
//       <div
//         style={{
//           flex: 1,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <div className="card-style" style={{ maxWidth: 450 }}>
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               marginBottom: 20,
//             }}
//           >
//             <h1>Admin Dashboard</h1>
//             <button
//               className="btn-style"
//               style={{
//                 fontSize: "1rem",
//                 padding: "7px 17px",
//                 borderRadius: 12,
//               }}
//               onClick={logout}
//             >
//               Logout
//             </button>
//           </div>
//           <div>
//             <div
//               className="banner"
//               style={{
//                 marginBottom: 32,
//                 marginTop: 0,
//                 background: "linear-gradient(90deg,#d4eeff 0%,#cbeeec 80%)",
//               }}
//             >
//               Welcome,{" "}
//               <span style={{ color: "#088", fontWeight: 800 }}>
//                 {admin?.email}!
//               </span>
//             </div>
//             {summary.standupTime ? (
//               <div style={{ marginBottom: 8 }}>
//                 <div
//                   style={{
//                     fontSize: "1.08rem",
//                     color: "#185b7e",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "12px",
//                     fontWeight: 600,
//                   }}
//                 >
//                   <div>
//                     <span>Today's Standup:</span>
//                     <span
//                       style={{
//                         marginLeft: 11,
//                         color: "#117ddb",
//                         fontSize: "1.21rem",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {summary.standupTime}
//                     </span>
//                   </div>
//                   <div>
//                     <span>Attendance:</span>
//                     <span
//                       style={{
//                         marginLeft: 9,
//                         color: "#18ad7c",
//                         fontWeight: "bold",
//                         fontSize: "1.19rem",
//                       }}
//                     >
//                       {summary.present} / {summary.total}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div>
//                 <div
//                   className="banner"
//                   style={{
//                     color: "#b85c42",
//                     background:
//                       "linear-gradient(90deg,#ffece6 0%, #f4e6e6 100%)",
//                     marginTop: 20,
//                     fontWeight: 600,
//                     fontSize: "1.07rem",
//                   }}
//                 >
//                   No standup scheduled today.
//                 </div>
//                 {/* Show Schedule Standup button below message */}
//                 <Button
//                   size="lg"
//                   className="w-full mt-6 font-bold"
//                   onClick={handleScheduleStandup}
//                   data-testid="admin-schedule-standup-home-btn"
//                 >
//                   Schedule Standup
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminHome;

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import "./AdminHome.css";

const AdminHome = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = React.useState<{
    standupTime: string | null;
    present: number;
    total: number;
  }>({ standupTime: null, present: 0, total: 0 });

  const [employeeCount, setEmployeeCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!admin) navigate("/admin/login");
  }, [admin, navigate]);

  React.useEffect(() => {
    async function fetchSummaryAndEmployees() {
      const todayStr = new Date().toISOString().slice(0, 10);

      // Fetch standup details
      const { data: standup } = await supabase
        .from("standups")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let standupTime = null,
        present = 0,
        total = 0;

      if (standup) {
        const { data: attendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("standup_id", standup.id);

        present = attendance
          ? attendance.filter((a) => a.status === "Present").length
          : 0;
        total = attendance ? attendance.length : 0;

        standupTime = new Date(standup.scheduled_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      setSummary({ standupTime, present, total });

      // Fetch employee count
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      if (!error && typeof count === "number") {
        setEmployeeCount(count);
      } else {
        console.error("Error fetching employee count:", error);
      }
    }

    fetchSummaryAndEmployees();
  }, []);

  const handleScheduleStandup = () => {
    navigate("/standups");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        margin: 0,
      }}
    >
      <AppNavbar />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="card-style" style={{ maxWidth: 450 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h1>Admin Dashboard</h1>
            <button
              className="btn-style"
              style={{
                fontSize: "1rem",
                padding: "7px 17px",
                borderRadius: 12,
              }}
              onClick={logout}
            >
              Logout
            </button>
          </div>
          <div>
            <div
              className="banner"
              style={{
                marginBottom: 32,
                marginTop: 0,
                background: "linear-gradient(90deg,#d4eeff 0%,#cbeeec 80%)",
              }}
            >
              Welcome,{" "}
              <span style={{ color: "#088", fontWeight: 800 }}>
                {admin?.email}!
              </span>
            </div>

            {summary.standupTime ? (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: "1.08rem",
                    color: "#185b7e",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    fontWeight: 600,
                  }}
                >
                  <div>
                    <span>Today's Standup:</span>
                    <span
                      style={{
                        marginLeft: 11,
                        color: "#117ddb",
                        fontSize: "1.21rem",
                        fontWeight: "bold",
                      }}
                    >
                      {summary.standupTime}
                    </span>
                  </div>
                  <div>
                    <span>Attendance:</span>
                    <span
                      style={{
                        marginLeft: 9,
                        color: "#18ad7c",
                        fontWeight: "bold",
                        fontSize: "1.19rem",
                      }}
                    >
                      {summary.present} / {employeeCount}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className="banner"
                  style={{
                    color: "#b85c42",
                    background:
                      "linear-gradient(90deg,#ffece6 0%, #f4e6e6 100%)",
                    marginTop: 20,
                    fontWeight: 600,
                    fontSize: "1.07rem",
                  }}
                >
                  No standup scheduled today.
                </div>
                <Button
                  size="lg"
                  className="w-full mt-6 font-bold"
                  onClick={handleScheduleStandup}
                  data-testid="admin-schedule-standup-home-btn"
                >
                  Schedule Standup
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
