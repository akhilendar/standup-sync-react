// Update this page (the content is just a fallback if you fail to update the page)

import AppNavbar from "@/components/AppNavbar";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Attendance Tracker</h1>
          <p className="text-xl text-muted-foreground mb-8">Manage employees, schedule standups, and track attendance with ease.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
