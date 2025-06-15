
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import ProfileEditor from "./ProfileEditor";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/context/AdminAuthContext";

// Do not define Employees link; only show for admin
const links = [
  { path: "/", label: "Home" },
  { path: "/standups", label: "Standups" },
  { path: "/attendance", label: "Attendance" }
];

export default function AppNavbar() {
  const { pathname } = useLocation();
  const { profile, loading, logout: memberLogout } = useUser();
  const { admin, logout: adminLogout } = useAdminAuth();
  const [showProfile, setShowProfile] = React.useState(false);

  // Get current user information (profile/avatar) from either admin or member
  const isLoggedIn = !!profile || !!admin;
  const displayName = profile?.name || admin?.email || "User";
  const displayAvatar = profile?.avatar_url || undefined;

  // Combined logout handler
  const handleLogout = () => {
    if (admin) adminLogout();
    if (profile) memberLogout();
  };

  // Determine if current user is an admin
  const isAdmin = !!admin;

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
        {/* Show Employees tab only for admin */}
        {isAdmin && (
          <li>
            <Link
              to="/admin/employees"
              className={cn(
                "py-2 px-3 rounded hover:bg-muted/40 transition-colors",
                pathname === "/admin/employees" && "font-semibold bg-muted"
              )}
            >
              Employees
            </Link>
          </li>
        )}
        {!loading && isLoggedIn && (
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-2 text-muted-foreground hover:bg-muted/30 rounded transition-colors"
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                      {displayName?.slice(0, 1).toUpperCase() ?? "U"}
                    </span>
                  )}
                  <span className="hidden md:inline">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile && (
                  <>
                    <DropdownMenuItem onClick={() => setShowProfile(true)}>
                      Change username / image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ProfileEditor open={showProfile} onOpenChange={setShowProfile} />
          </li>
        )}
      </ul>
    </nav>
  );
}
