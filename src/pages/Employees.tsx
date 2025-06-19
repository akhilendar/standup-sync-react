import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import React from "react";

type Employee = {
  id: string;
  name: string;
  email: string;
};

export default function Employees() {
  const queryClient = useQueryClient();

  // Fetch employees from Supabase
  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Add new employee mutation
  const { mutate: addEmployee, isPending } = useMutation({
    mutationFn: async (values: { name: string; email: string }) => {
      const { error } = await supabase.from("employees").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employee added!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message });
    },
  });

  // Form for adding employee
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    email: string;
  }>();

  function onSubmit(values: { name: string; email: string }) {
    addEmployee(values, {
      onSuccess: () => reset(),
    });
  }

  return (
    <div className="max-w-xl mx-auto my-10">
      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Input
              placeholder="Name"
              {...register("name", { required: true })}
            />
            <Input
              placeholder="Email"
              type="email"
              {...register("email", { required: true })}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Employee"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : employees?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground">No employees yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
