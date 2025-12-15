'use client'

import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?._id, user?.profilePictureUrl]);

  // Debug: Log user data to see if profilePictureUrl is present
  useEffect(() => {
    if (user) {
      console.log('Topbar - User data:', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
        hasProfilePicture: !!user.profilePictureUrl
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  };

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    return user.roles[0] || 'User';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees, departments, or documents..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              {user.profilePictureUrl && user.profilePictureUrl.trim() !== '' && !imageError ? (
                <img
                  src={user.profilePictureUrl}
                  alt={getUserDisplayName()}
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                  onError={(e) => {
                    console.error('Topbar - Image failed to load:', user.profilePictureUrl);
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log('Topbar - Image loaded successfully:', user.profilePictureUrl);
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getUserInitials()}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">{getUserDisplayName()}</p>
                <p className="text-xs text-slate-500">{getUserRole()}</p>
              </div>
              <div className="relative group">
                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

