import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";
import DateRangePicker from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";

interface Employee {
  id: string;
  name: string;
  email: string;
  // Add more fields as necessary
}

// Define a simple type for attendance data
interface AttendanceData {
  id: string;
  standup_id: string;
  status: string;
  standups: {
    scheduled_at: string;
  };
  // Add more fields as necessary
}

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

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
        setEmployee(employeeData);

        // Fetch attendance data with scheduled dates
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("id, standup_id, status, standups(scheduled_at), marked_at")
          .eq("employee_id", employeeData.id);
        if (attendanceError) throw attendanceError;

        const { data: sampleAttendanceData } = await supabase.from("attendance").select("*");

        console.log(sampleAttendanceData);

        // Process and set attendance data
        setAttendanceData(attendanceData);
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

  const handleViewToggle = () => {
    setView((prevView) => (prevView === "weekly" ? "monthly" : "weekly"));
  };

  const filterDataByDateRange = (data: AttendanceData[]) => {
    if (!dateRange) return data;
    return data.filter((record) => {
      const date = new Date(record.standups.scheduled_at);
      return date >= dateRange.start && date <= dateRange.end;
    });
  };

  const aggregateData = (data: AttendanceData[]) => {
    // Aggregate data based on the selected view (weekly or monthly)
    // This is a placeholder implementation
    return data.map((record) => ({
      name: new Date(record.standups.scheduled_at).toLocaleDateString(),
      uv: record.status === "Present" ? 1 : 0,
    }));
  };

  const filteredData = filterDataByDateRange(attendanceData);
  const chartData = aggregateData(filteredData);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!employee) {
    return <div>Employee not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto my-10">
      <Card>
        <CardHeader>
          <CardTitle>{employee.name}</CardTitle>
          <CardDescription>{employee.email}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toggle button for weekly/monthly view */}
          <button onClick={handleViewToggle} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Toggle to {view === "weekly" ? "Monthly" : "Weekly"} View
          </button>

          <div className="flex items-end gap-2">
            {/* Date range picker */}
            <DateRangePicker value={dateRange} onChange={setDateRange} className="mt-4" />

            <Button onClick={() => setDateRange(null)}>Clear</Button>
          </div>

          {/* Display attendance data in a table */}
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.standups.scheduled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visualize data in a chart */}
          <ChartContainer
            config={{
              sampleData: { label: "Sample Data", color: "#8884d8" },
            }}
          >
            {/* Example chart using Recharts */}
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="uv" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDetail;
