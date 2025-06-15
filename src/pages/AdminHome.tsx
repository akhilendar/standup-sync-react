
import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdminHome = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!admin) navigate("/admin/login");
  }, [admin, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4">
      <Card className="w-full max-w-2xl mt-10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Admin Home</CardTitle>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <span className="font-semibold">Welcome, {admin?.email}!</span>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full"
              variant="default"
              onClick={() => navigate("/admin/employees")}
            >
              Manage Employees
            </Button>
            <Button
              className="w-full"
              variant="default"
              onClick={() => navigate("/admin/attendance")}
            >
              Manage Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
