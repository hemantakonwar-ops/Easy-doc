"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Plus, LogOut, Settings, User, Moon } from "lucide-react";
import { cn } from "../lib/utils/cn";
import Link from "next/link";
import { getFeatures, FeatureFlags } from "../lib/features";
import { getCurrentUser, logout } from "../features/auth/authService";

interface HeaderProps {
  className?: string;
  documentName?: string;
  uploadDate?: string;
  fileSize?: string;
  onMenuClick?: () => void;
  children?: React.ReactNode;
}

export default function Header({ className, documentName, uploadDate, fileSize, onMenuClick, children }: HeaderProps) {
  const router = useRouter();
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setFeatures(getFeatures());
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const uploadEnabled = features?.uploadDocument ?? true;
  const notificationsEnabled = features?.notifications ?? true;

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsProfileOpen(false);
  };

  if (!features) return null;

  return (
    <header className={cn("bg-[#fffdf9]/95 backdrop-blur border-b border-[#e8e1d8] px-4 lg:px-8 py-4", className)}>
      <div className="flex items-center justify-between gap-4">
        {/* Left - Page Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            {documentName ? (
              <div>
                <h1 className="font-editorial text-xl sm:text-2xl text-[#181715] truncate">{documentName}</h1>
                <p className="text-xs sm:text-sm text-[#777169] mt-0.5">
                  Uploaded {uploadDate} • {fileSize}
                </p>
              </div>
            ) : (
              <div>
                <p className="editorial-label">Overview</p>
                <h1 className="font-editorial text-2xl text-[#181715]">Dashboard</h1>
              </div>
            )}
          </div>
        </div>

        {/* Center - Toggle Buttons */}
        {children && (
          <div className="hidden lg:flex items-center">
            {children}
          </div>
        )}

        {/* Right - Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {uploadEnabled && (
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#181715] hover:bg-transparent hover:text-[#181715] text-[#fffdf9] border border-[#181715] transition-all font-bold text-[11px] uppercase tracking-[0.16em]"
            >
              <Plus className="w-4 h-4" />
              <span>Upload</span>
            </Link>
          )}

          {notificationsEnabled && (
            <button className="relative p-2.5 text-[#777169] hover:bg-[#f7f4ef] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#a77a35] rounded-full ring-2 ring-[#fffdf9]"></span>
            </button>
          )}

          <button className="hidden sm:flex p-2.5 text-[#777169] hover:bg-[#f7f4ef] transition-colors" aria-label="Theme">
            <Moon className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-[#e8e1d8] hover:bg-[#f7f4ef] p-1.5 transition-colors"
            >
              <div className="w-9 h-9 bg-[#181715] flex items-center justify-center text-[#fffdf9] font-semibold text-sm shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-[#181715] leading-tight">{user?.name || "User"}</p>
                <p className="text-xs text-[#777169] leading-tight">{user?.email || "user@email.com"}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-[#777169] transition-transform", isProfileOpen && "rotate-180")} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#fffdf9] shadow-xl border border-[#e8e1d8] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#e8e1d8] lg:hidden">
                  <p className="text-sm font-semibold text-[#181715]">{user?.name || "User"}</p>
                  <p className="text-xs text-[#777169]">{user?.email || ""}</p>
                </div>
                
                <div className="px-2">
                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#5f5952] hover:bg-[#f7f4ef] transition-colors">
                    <User className="w-4 h-4 text-[#777169]" />
                    Profile
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#5f5952] hover:bg-[#f7f4ef] transition-colors">
                    <Settings className="w-4 h-4 text-[#777169]" />
                    Settings
                  </button>
                </div>
                
                <div className="mt-2 pt-2 border-t border-[#e8e1d8] px-2">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
