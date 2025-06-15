
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppNavbar from "@/components/AppNavbar";

type Employee = {
  id: string;
  name: string;
  email: string;
  // add extra fields if needed in the future
};

const fetchEmployees = async (): Promise<Employee[]> => {
  const { createClient } = await import("@/integrations/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase.from("employees").select();
  if (error) throw error;
  return data || [];
};

export default function AdminEmployees() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!admin) {
      navigate("/admin/login");
      return;
    }
    setLoading(true);
    setError(null);
    fetchEmployees()
      .then(setEmployees)
      .catch((e) => setError(e.message || "Error fetching employees"))
      .finally(() => setLoading(false));
  }, [admin, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="flex-1 flex flex-col items-center py-10">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manage Employees</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>Back</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <div>Loading employees...</div>}
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            {employees && (
              <table className="w-full table-auto border mt-2">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{emp.name}</td>
                      <td className="px-4 py-2">{emp.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {employees && employees.length === 0 && (
              <div>No employees found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
