
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import ProfileEditor from "./ProfileEditor";
import React from "react";

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
  const [showProfile, setShowProfile] = React.useState(false);

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
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-2 text-muted-foreground hover:bg-muted/30 rounded transition-colors"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                    {profile.name?.slice(0, 1).toUpperCase() ?? "U"}
                  </span>
                )}
                <span className="hidden md:inline">{profile.name}</span>
              </button>
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
      <ProfileEditor open={showProfile} onOpenChange={setShowProfile} />
    </nav>
  );
}
