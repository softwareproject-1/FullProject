'use client'

import { Bell, Search, ChevronDown } from 'lucide-react';

export function Topbar() {
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
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              AU
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">HR Manager</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}