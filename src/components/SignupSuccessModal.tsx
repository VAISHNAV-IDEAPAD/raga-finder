'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
  Heart,
  Music,
  Eye,
  ArrowLeft,
  X,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { UserEntry } from '@/types/user';
import { getWelcomeEmailHtml } from '@/lib/emailTemplates';

interface SignupSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserEntry | null;
  notificationMessage?: string;
}

export default function SignupSuccessModal({
  isOpen,
  onClose,
  user,
  notificationMessage,
}: SignupSuccessModalProps) {
  const [showEmailViewer, setShowEmailViewer] = useState(false);

  if (!isOpen || !user) return null;

  const isEmail = Boolean(user.email);
  const emailHtml = user.emailPayload?.html || getWelcomeEmailHtml(user.name, user.email || 'Member');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
      {/* Email Viewer Mode */}
      {showEmailViewer ? (
        <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl glass-panel shadow-2xl border-2 border-amber-300 bg-white overflow-hidden flex flex-col animate-scaleUp">
          {/* Email Client Header */}
          <div className="p-4 px-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <button
              type="button"
              onClick={() => setShowEmailViewer(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Received &bull; Verified
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Envelope / Metadata Bar */}
          <div className="p-4 px-6 bg-amber-50/70 border-b border-amber-200/80 text-left space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Welcome to Raga Finder Family, {user.name}! 🎵
              </h3>
              <span className="text-[10px] font-mono text-stone-400 shrink-0">
                Just now
              </span>
            </div>
            <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <div>
                <strong className="text-stone-700 font-semibold">From:</strong>{' '}
                <span className="text-stone-800">Raga Finder Family &lt;welcome@ragafinder.com&gt;</span>
              </div>
              <div>
                <strong className="text-stone-700 font-semibold">To:</strong>{' '}
                <span className="text-stone-800">{user.name} &lt;{user.email || user.mobile}&gt;</span>
              </div>
            </div>
          </div>

          {/* Rendered Email Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
            <div
              className="rounded-2xl shadow-sm border border-stone-200 overflow-hidden bg-white"
              dangerouslySetInnerHTML={{ __html: emailHtml }}
            />
          </div>

          {/* Email Footer Bar */}
          <div className="p-4 px-6 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">
              Your official greeting letter has been generated and saved.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue to Raga Finder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Standard Celebration Overview Card */
        <div className="w-full max-w-lg rounded-3xl glass-panel shadow-2xl border-2 border-amber-300 bg-white/95 overflow-hidden text-center transition-all animate-scaleUp">
          {/* Celebration Header */}
          <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-amber-100 via-orange-50 to-white relative overflow-hidden">
            {/* Confetti decoration */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-raga-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-raga-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-raga-500/30 ring-4 ring-white animate-bounce">
                <Heart className="w-10 h-10 fill-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-raga-600" />
              Welcome Celebration
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
              Thank You For Joining Raga Finder Family
            </h2>

            <p className="mt-2 text-stone-600 text-sm max-w-md mx-auto">
              Welcome aboard, <strong className="text-stone-900">{user.name}</strong>! Your account has been created and verified.
            </p>
          </div>

          {/* Details & Notification Delivery Card */}
          <div className="p-6 sm:p-8 space-y-5">
            {/* Notification Dispatch Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5 shadow-sm">
                  {isEmail ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-emerald-950 block">
                    {isEmail ? 'Greeting Email Delivered!' : 'SMS Notification Dispatched!'}
                  </span>
                  <p className="text-emerald-800 text-xs mt-0.5 leading-relaxed">
                    Sent to <strong>{user.email || user.mobile}</strong>. Your personal welcome letter has been received.
                  </p>
                </div>
              </div>

              {/* View Received Mail Button */}
              {isEmail && (
                <button
                  type="button"
                  onClick={() => setShowEmailViewer(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Eye className="w-4 h-4" />
                  <span>📬 Read Received Greeting Email</span>
                </button>
              )}
            </div>

            {/* Member Card Summary */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-12 h-12 rounded-2xl border-2 border-amber-300 bg-white object-cover"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">{user.name}</span>
                  <span className="text-[11px] text-stone-500 block truncate">
                    {user.email || user.mobile}
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 uppercase">
                    {user.provider} member
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Status</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-black text-sm sm:text-base shadow-lg shadow-raga-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>Start Exploring Ragas</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

