
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { path: "/", label: "Home" },
  // Removed "Employees" link
  { path: "/standups", label: "Standups" },
  { path: "/attendance", label: "Attendance" },
  { path: "/admin/login", label: "Admin" }
];

export default function AppNavbar() {
  const { pathname } = useLocation();

  return (
    <nav className="w-full flex justify-center bg-background border-b">
      <ul className="flex gap-4 py-4">
        {links.map(({ path, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={cn(
                "py-2 px-3 rounded hover:bg-muted/40 transition-colors",
                pathname === path && "font-semibold bg-muted"
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
