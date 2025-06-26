import AdminEmployeeFeedback from "@/components/Admin/dashboard/EmployeeTabs/AdminEmployeeFeedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import AppNavbar from "@/components/AppNavbar";

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  ratings_sheet_link: string | null;
  role: string;
  // Add more fields as necessary
}

const AdminEmployeePage = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        // Fetch employee details
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const { data, error } = await supabase.from<Employee>("employees").select("*").eq("employee_id", id).single();

        const employeeData = data as unknown as Employee;
        const employeeError = error;
        if (employeeError) throw employeeError;
        setEmployee({
          employee_id: employeeData.employee_id,
          name: employeeData.name,
          email: employeeData.email,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ratings_sheet_link: employeeData.ratings_sheet_link ?? null,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          role: employeeData.role ?? "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  return loading ? (
    <div>Loading...</div>
  ) : (
    <>
      <AppNavbar />
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{employee.name}</CardTitle>
          <CardDescription>{employee.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="feedback" className="flex flex-col items-center justify-center">
            <TabsList className="grid w-full grid-cols-3 max-w-96">
              <TabsTrigger value="standup">Standup</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
            <TabsContent value="standup"></TabsContent>
            <TabsContent value="feedback">
              <AdminEmployeeFeedback sheet={employee.ratings_sheet_link} />
            </TabsContent>
            <TabsContent value="attendance">Attendance</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminEmployeePage;
