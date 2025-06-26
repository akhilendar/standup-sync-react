import AdminEmployeeFeedback from "@/components/Admin/dashboard/EmployeeTabs/AdminEmployeeFeedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
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
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", id)
          .single();
        if (employeeError) throw employeeError;
        console.log("Employee Data:", employeeData);
        setEmployee({
          id: employeeData.id,
          name: employeeData.name,
          email: employeeData.email,
          ratings_sheet_link: employeeData.ratings_sheet_link ?? null,
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
  );
};

export default AdminEmployeePage;
