
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Users, Calendar, ClipboardList, BookOpen, GraduationCap } from 'lucide-react';
import ChangePassword from './ChangePassword';

const AppNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { user, profile, logout } = useUser();
  const { admin, logout: adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (admin) {
      adminLogout();
    } else {
      await logout();
    }
    navigate('/');
  };

  const isAdmin = admin || profile?.role === 'admin';
  const currentUser = admin || profile;
  const userName = admin?.name || profile?.name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const toggleMobile = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">TeamSync</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/standups"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <Calendar size={18} />
                Standups
              </Link>
              <Link
                to="/attendance"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <ClipboardList size={18} />
                Attendance
              </Link>
              <Link
                to="/learning-hours"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <BookOpen size={18} />
                Learning Hours
              </Link>
              <Link
                to="/learning-hours-attendance"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <GraduationCap size={18} />
                LH Attendance
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Users size={18} />
                    Admin
                  </Link>
                  <Link
                    to="/admin/employees"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Users size={18} />
                    Employees
                  </Link>
                </>
              )}
            </div>

            {/* User Avatar and Dropdown */}
            {currentUser && (
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || undefined} alt={userName} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem className="flex items-center" onClick={() => setShowChangePassword(true)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Change Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobile}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
              <Link
                to="/standups"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Standups
              </Link>
              <Link
                to="/attendance"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Attendance
              </Link>
              <Link
                to="/learning-hours"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Learning Hours
              </Link>
              <Link
                to="/learning-hours-attendance"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                LH Attendance
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    to="/admin/employees"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Employees
                  </Link>
                </>
              )}
              {currentUser && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={avatarUrl || undefined} alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700 text-base font-medium">{userName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setIsOpen(false);
                    }}
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <ChangePassword 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </>
  );
};

export default AppNavbar;
