'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { UserEntry } from '@/types/user';

interface UserProfileBadgeProps {
  user: UserEntry;
  onLogout: () => void;
}

export default function UserProfileBadge({ user, onLogout }: UserProfileBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-white/90 hover:bg-white border border-amber-300 shadow-sm transition-all group"
      >
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
          alt={user.name}
          className="w-8 h-8 rounded-xl object-cover bg-amber-100 border border-amber-200"
        />
        <div className="text-left hidden sm:block">
          <span className="text-xs font-bold text-stone-900 group-hover:text-raga-600 transition-colors block max-w-[110px] truncate leading-tight">
            {user.name}
          </span>
          <span className="text-[10px] text-stone-500 block leading-tight">
            Member
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl border border-amber-300 bg-white/95 p-3 z-50 animate-fadeIn space-y-2">
          <div className="p-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-900 block">{user.name}</span>
            <span className="text-[11px] text-stone-500 block truncate mt-0.5">
              {user.email || user.mobile}
            </span>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active Member ({user.provider})
            </span>
          </div>

          <div className="text-[11px] text-stone-500 px-2 py-1">
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
