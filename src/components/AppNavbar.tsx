import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";

const links = [
  { path: "/", label: "Home" },
  { path: "/standups", label: "Standups" },
  { path: "/attendance", label: "Attendance" },
  { path: "/admin/login", label: "Admin" }
];

export default function AppNavbar() {
  const { pathname } = useLocation();
  const { profile, loading, logout } = useUser();
  const navigate = useNavigate();

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
        {!loading && profile && (
          <>
            <li>
              <span className="px-2 text-muted-foreground">
                {profile.name} ({profile.role})
              </span>
            </li>
            <li>
              <button
                onClick={logout}
                className="py-2 px-3 rounded hover:bg-destructive hover:text-white transition-colors text-muted-foreground"
              >Logout</button>
            </li>
          </>
        )}
        {!loading && !profile && (
          <li>
            <Link
              to="/auth"
              className={cn(
                "py-2 px-3 rounded hover:bg-primary/20 transition-colors text-muted-foreground font-semibold"
              )}
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
