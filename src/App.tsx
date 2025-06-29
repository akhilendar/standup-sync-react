
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Standups from "./pages/Standups";
import Attendance from "./pages/Attendance";
import LearningHours from "./pages/LearningHours";
import LearningHoursAttendance from "./pages/LearningHoursAttendance";
import AdminLogin from "./pages/AdminLogin";
import AdminHome from "./pages/AdminHome";
import AdminEmployees from "./pages/AdminEmployees";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AuthPage from "./pages/AuthPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/standups" element={<Standups />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/learning-hours" element={<LearningHours />} />
            <Route path="/learning-hours-attendance" element={<LearningHoursAttendance />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
