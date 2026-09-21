'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Play,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  Info,
  Check,
  X,
  Users,
  Mail,
  Phone,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  MailCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminRule, MistakeReport, IdentifyResponse } from '@/types/raga';
import { UserEntry } from '@/types/user';
import { EmailConfig } from '@/types/email';
import { getWelcomeEmailHtml } from '@/lib/emailTemplates';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'rules' | 'reports' | 'members' | 'email' | 'playground' | 'backup'>('rules');

  // Rules state
  const [rules, setRules] = useState<AdminRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AdminRule> | null>(null);

  // Reports state
  const [reports, setReports] = useState<MistakeReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Members state
  const [members, setMembers] = useState<UserEntry[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberProviderFilter, setMemberProviderFilter] = useState<string>('all');
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [previewEmailUser, setPreviewEmailUser] = useState<UserEntry | null>(null);

  // Email Configuration state
  const [emailConfig, setEmailConfig] = useState<Partial<EmailConfig>>({
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPass: '',
    fromName: 'Raga Finder Family',
    fromEmail: '',
    resendApiKey: '',
    brevoApiKey: '',
  });
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);
  const [loadingEmailConfig, setLoadingEmailConfig] = useState(false);
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Live Test Email state
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string; log?: string[] } | null>(null);

  // Playground state
  const [testQuery, setTestQuery] = useState('S R2 G3 P D2');
  const [testMode, setTestMode] = useState<'swaras' | 'song' | 'description'>('swaras');
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<IdentifyResponse | null>(null);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check saved key on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('raga_admin_key');
    if (saved) {
      setAdminKey(saved);
      verifyKey(saved);
    }
  }, []);

  const verifyKey = async (key: string) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: key }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        sessionStorage.setItem('raga_admin_key', key);
        loadRules(key);
        loadReports(key);
        loadMembers(key);
        loadEmailConfig(key);
      } else {
        setAuthError(data.error || 'Invalid Admin Secret Key');
        setIsAuthenticated(false);
      }
    } catch {
      setAuthError('Connection error during authentication');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    verifyKey(adminKey);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('raga_admin_key');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  const loadRules = async (key = adminKey) => {
    setLoadingRules(true);
    try {
      const res = await fetch('/api/admin/rules', {
        headers: { 'x-admin-key': key },
      });
      const data = await res.json();
      if (res.ok && data.rules) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error('Error loading rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const loadReports = async (key = adminKey) => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { 'x-admin-key': key },
      });
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadMembers = async (key = adminKey) => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/admin/members', {
        headers: { 'x-admin-key': key },
      });
      const data = await res.json();
      if (res.ok && data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove member "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        showToast(`Member "${name}" removed successfully.`);
      } else {
        alert('Failed to delete member');
      }
    } catch {
      alert('Failed to delete member');
    }
  };

  const handleExportMembersCsv = () => {
    if (members.length === 0) {
      alert('No members to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Provider', 'Notification Sent', 'Joined Date'];
    const rows = members.map((m) => [
      `"${m.id}"`,
      `"${m.name}"`,
      `"${m.email || ''}"`,
      `"${m.mobile || ''}"`,
      `"${m.provider}"`,
      `"${m.welcomeNotificationSent ? 'Yes' : 'No'}"`,
      `"${new Date(m.createdAt).toLocaleString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `raga_family_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const loadEmailConfig = async (key = adminKey) => {
    setLoadingEmailConfig(true);
    try {
      const res = await fetch('/api/admin/email-config', {
        headers: { 'x-admin-key': key },
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setEmailConfig(data.config);
        setIsEmailConfigured(data.config.isConfigured);
        if (data.config.smtpUser && !testEmailTarget) {
          setTestEmailTarget(data.config.smtpUser);
        }
      }
    } catch (err) {
      console.error('Error loading email config:', err);
    } finally {
      setLoadingEmailConfig(false);
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmailConfig(true);
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(emailConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Email configuration saved successfully!');
        setIsEmailConfigured(data.isConfigured);
      } else {
        alert(data.error || 'Failed to save email configuration');
      }
    } catch (err: any) {
      alert('Network error saving email configuration');
    } finally {
      setSavingEmailConfig(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTarget || !testEmailTarget.includes('@')) {
      alert('Please enter a valid target email address for the test.');
      return;
    }
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ targetEmail: testEmailTarget.trim() }),
      });
      const data = await res.json();
      setEmailTestResult(data);
      if (data.success) {
        showToast(`Test email delivered to ${testEmailTarget}!`);
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: 'Network failure during test email transmission.',
        log: [err.message],
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleResendMemberEmail = async (userId: string, userName: string) => {
    setResendingEmailId(userId);
    try {
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Welcome email successfully resent to ${userName}!`);
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, welcomeNotificationSent: true } : m))
        );
      } else {
        alert(`Failed to resend email: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch {
      alert('Network error while resending welcome email');
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.title || !editingRule.correctRaga || !editingRule.ruleInstruction) {
      alert('Please fill in Title, Correct Raga, and Rule Instruction');
      return;
    }

    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(editingRule),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save rule');
      }

      showToast(`Rule "${editingRule.title}" taught to OpenAI successfully!`);
      setEditingRule(null);
      loadRules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule? OpenAI will revert to default knowledge.')) return;

    try {
      const res = await fetch(`/api/admin/rules?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        showToast('Rule deleted.');
        loadRules();
      }
    } catch (err) {
      alert('Error deleting rule');
    }
  };

  const handleApproveReportAsRule = async (report: MistakeReport) => {
    const swaras = report.userCorrection.correctSwaras
      ? report.userCorrection.correctSwaras.split(/[\s,]+/).filter(Boolean)
      : [];

    const ruleData = {
      title: `Correction for ${report.userCorrection.correctRaga}`,
      patternType: 'correction',
      swaraPattern: swaras,
      triggerKeywords: [report.userCorrection.correctRaga, report.aiSuggestedRaga],
      correctRaga: report.userCorrection.correctRaga,
      tradition: 'Both',
      ruleInstruction: `MISTAKE CORRECTION: When queried with notes [${swaras.join(', ')}] or context resembling "${report.userCorrection.notesOrExplanation}", correctly identify as "${report.userCorrection.correctRaga}", NOT "${report.aiSuggestedRaga}". Reason: ${report.userCorrection.notesOrExplanation}`,
    };

    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          reportId: report.id,
          action: 'approve_as_rule',
          convertToRule: ruleData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Report converted to Ground-Truth Rule! OpenAI has been taught.`);
        loadReports();
        loadRules();
      }
    } catch (err) {
      alert('Failed to convert report into rule');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          reportId,
          action: 'dismiss',
        }),
      });
      if (res.ok) {
        showToast('Report dismissed.');
        loadReports();
      }
    } catch (err) {
      alert('Failed to dismiss report');
    }
  };

  const handleRunPlaygroundTest = async () => {
    setTestingAi(true);
    setTestResult(null);

    const payload: any = { mode: testMode };
    if (testMode === 'swaras') {
      payload.swaras = testQuery.split(/[\s,]+/).filter(Boolean);
    } else if (testMode === 'song') {
      payload.songQuery = testQuery;
    } else {
      payload.description = testQuery;
    }

    // Attach stored AI key if available
    const storedAiKey = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_key') : null;
    const storedAiProvider = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_provider') : null;
    if (storedAiKey) {
      payload.aiApiKey = storedAiKey;
      if (storedAiProvider) payload.aiProvider = storedAiProvider;
    }

    try {
      const res = await fetch('/api/identify-raga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data);
      } else {
        alert(data.error || 'Test failed');
      }
    } catch (err) {
      alert('Failed to run test');
    } finally {
      setTestingAi(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `raga_admin_rules_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          alert('Invalid JSON: Must be an array of rules');
          return;
        }

        const res = await fetch('/api/admin/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey,
          },
          body: JSON.stringify({ bulk: true, rules: imported }),
        });

        if (res.ok) {
          showToast(`Imported ${imported.length} rules successfully!`);
          loadRules();
        }
      } catch (err) {
        alert('Failed to parse and import JSON rules');
      }
    };
    reader.readAsText(file);
  };

  const filteredMembers = members.filter((m) => {
    if (memberProviderFilter !== 'all' && m.provider !== memberProviderFilter) {
      return false;
    }
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchMobile = (m.mobile || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchMobile;
    }
    return true;
  });

  // Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel shadow-2xl border border-amber-200/80">
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-stone-900">Admin Teaching Portal</h1>
            <p className="text-xs text-stone-500">
              Enter your Admin Secret Key to manage ground-truth rules and train OpenAI without mistakes.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter secret key..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 pl-10 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Default for testing: <code className="text-amber-700 font-mono">ragamaster2026</code>
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Authenticate & Enter</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-stone-900 text-white shadow-2xl border border-amber-400/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-900 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              AI Musicologist Teaching Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Active Ground-Truth Knowledge Base: Every rule here is injected directly into OpenAI&apos;s system prompt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadRules();
              loadReports();
            }}
            className="p-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 transition-colors flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-700 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Active Teaching Rules</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {rules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Reported Mistakes Queue</span>
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 animate-pulse">
              {reports.filter((r) => r.status === 'pending').length} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('members');
            loadMembers();
          }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Registered Members</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('email');
            loadEmailConfig();
          }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'email'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <MailCheck className="w-4 h-4 text-amber-600" />
          <span>Email & Notifications</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isEmailConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isEmailConfigured ? 'Active' : 'Setup Needed'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'playground'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Live Prompt Playground</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'border-raga-600 text-raga-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Download className="w-4 h-4 text-stone-500" />
          <span>Export / Import Backup</span>
        </button>
      </div>

      {/* Tab 1: Rules */}
      {activeTab === 'rules' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Ground-Truth Musicology Rules</h2>
              <p className="text-xs text-stone-500">
                These rules are permanently injected into the OpenAI system prompt, eliminating false positives.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditingRule({
                  title: '',
                  patternType: 'swaras',
                  swaraPattern: [],
                  triggerKeywords: [],
                  correctRaga: '',
                  tradition: 'Both',
                  ruleInstruction: '',
                  severity: 'strict_override',
                  active: true,
                })
              }
              className="px-4 py-2 text-xs font-bold rounded-xl bg-raga-600 hover:bg-raga-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Teach OpenAI New Rule</span>
            </button>
          </div>

          {/* Rule Creator / Editor Modal */}
          {editingRule && (
            <div className="p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-300 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">
                  {editingRule.id ? 'Edit Taught Rule' : 'Teach a New Ground-Truth Rule to OpenAI'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Rule Title / Scenario *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohanam Pentatonic Strictness"
                      value={editingRule.title || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Correct Raga Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohanam (Carnatic) / Bhoopali (Hindustani)"
                      value={editingRule.correctRaga || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, correctRaga: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Pattern Type
                    </label>
                    <select
                      value={editingRule.patternType || 'swaras'}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, patternType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="swaras">Swaras / Scale Pattern</option>
                      <option value="phrase">Signature Phrase (Pakad)</option>
                      <option value="song">Song Title / Lyrics</option>
                      <option value="correction">Disambiguation / Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Tradition
                    </label>
                    <select
                      value={editingRule.tradition || 'Both'}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, tradition: e.target.value as any })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Both">Both Carnatic & Hindustani</option>
                      <option value="Carnatic">Carnatic</option>
                      <option value="Hindustani">Hindustani</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={editingRule.severity || 'strict_override'}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, severity: e.target.value as any })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="strict_override">Strict Override (100% Mandatory)</option>
                      <option value="disambiguation_hint">Disambiguation Guidance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Swaras (space separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. S R2 G3 P D2"
                      value={editingRule.swaraPattern?.join(' ') || ''}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          swaraPattern: e.target.value.split(/[\s,]+/).filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Trigger Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Todi, Hanumatodi, Bhairavi"
                      value={editingRule.triggerKeywords?.join(', ') || ''}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          triggerKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Musicologist Instruction for OpenAI *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. When only notes S R2 G3 P D2 are present with no Ma or Ni, strictly identify as Mohanam (Carnatic) or Bhoopali (Hindustani). Never confuse with Shankarabharanam."
                    value={editingRule.ruleInstruction || ''}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, ruleInstruction: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save & Inject into OpenAI</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 rounded-2xl glass-panel border border-stone-200 hover:border-amber-300 shadow-sm transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-stone-900">{rule.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {rule.correctRaga}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                        {rule.tradition}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.severity === 'strict_override'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rule.severity === 'strict_override' ? 'Strict Override' : 'Guidance'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 mt-2 font-mono bg-stone-50 p-2 rounded-lg border border-stone-150 leading-relaxed">
                      &quot;{rule.ruleInstruction}&quot;
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-2">
                      {rule.swaraPattern && rule.swaraPattern.length > 0 && (
                        <span>Notes: {rule.swaraPattern.join(' ')}</span>
                      )}
                      {rule.triggerKeywords && rule.triggerKeywords.length > 0 && (
                        <span>Keywords: {rule.triggerKeywords.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingRule(rule)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                      title="Edit rule"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Mistake Reports Queue */}
      {activeTab === 'reports' && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">User & Admin Mistake Reports</h2>
            <p className="text-xs text-stone-500">
              When users report an incorrect raga, review it here. Approving converts it directly into a
              permanent rule taught to OpenAI!
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel border border-stone-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-900">No Mistake Reports Pending</h3>
              <p className="text-xs text-stone-500 mt-1">
                The raga identification engine is currently operating with zero flagged errors.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    r.status === 'resolved'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : r.status === 'dismissed'
                      ? 'bg-stone-50 border-stone-200 opacity-60'
                      : 'glass-panel border-amber-300 shadow-md'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'dismissed'
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(r.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-stone-600">
                          By: {r.userCorrection.reporterName || 'Anonymous'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-red-50 text-red-900 border border-red-150">
                          <span className="font-bold block">AI Suggested:</span>
                          <span>{r.aiSuggestedRaga}</span>
                        </div>

                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-150">
                          <span className="font-bold block">User Correction:</span>
                          <span>{r.userCorrection.correctRaga}</span>
                        </div>
                      </div>

                      {r.userCorrection.correctSwaras && (
                        <div className="text-xs text-stone-600">
                          <span className="font-bold">Correct Swaras: </span>
                          <span className="font-mono">{r.userCorrection.correctSwaras}</span>
                        </div>
                      )}

                      {r.userCorrection.notesOrExplanation && (
                        <p className="text-xs text-stone-700 bg-white/80 p-2.5 rounded-lg border border-stone-200">
                          <span className="font-bold block text-stone-500 mb-0.5">Explanation:</span>
                          {r.userCorrection.notesOrExplanation}
                        </p>
                      )}
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDismissReport(r.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-100 border border-stone-200"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveReportAsRule(r)}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Approve & Teach AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Playground */}
      {activeTab === 'playground' && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Live AI Prompt Playground</h2>
            <p className="text-xs text-stone-500">
              Test queries against OpenAI with the active ground-truth teaching rules applied.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-amber-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <select
                value={testMode}
                onChange={(e) => setTestMode(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-stone-300 bg-white"
              >
                <option value="swaras">By Swaras</option>
                <option value="song">By Song Title</option>
                <option value="description">By Description</option>
              </select>

              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter swaras or song title..."
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <button
                type="button"
                onClick={handleRunPlaygroundTest}
                disabled={testingAi || !testQuery.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingAi ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 text-amber-400" />
                )}
                <span>Test Live</span>
              </button>
            </div>

            {testResult && (
              <div className="mt-6 p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-stone-900">
                      {testResult.raga.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {testResult.raga.tradition}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {testResult.confidence}
                    </span>
                  </div>

                  {testResult.appliedAdminRule ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Rule Applied: {testResult.appliedAdminRule.title}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500">Standard AI Knowledge</span>
                  )}
                </div>

                <div className="text-xs font-mono bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                  <div>Arohana: {testResult.raga.arohana}</div>
                  <div>Avarohana: {testResult.raga.avarohana}</div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {testResult.raga.explanation}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule({
                        title: `Correction for query: ${testQuery}`,
                        patternType: testMode === 'swaras' ? 'swaras' : 'song',
                        correctRaga: '',
                        tradition: 'Both',
                        ruleInstruction: `When queried with "${testQuery}", do not identify as "${testResult.raga.name}". Instead, identify as: `,
                        active: true,
                        severity: 'strict_override',
                      });
                      setActiveTab('rules');
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 flex items-center gap-1"
                  >
                    <span>Teach Correction for this Query</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Backup */}
      {activeTab === 'backup' && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Knowledge Base Backup & Transfer</h2>
            <p className="text-xs text-stone-500">
              Download your taught rules as a JSON file or import verified raga rules from other deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl glass-panel border border-stone-200 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-600" />
                <span>Export Knowledge Base</span>
              </h3>
              <p className="text-xs text-stone-500">
                Save all {rules.length} active taught rules to a portable JSON backup file.
              </p>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download rules.json</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-stone-200 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import Knowledge Base</span>
              </h3>
              <p className="text-xs text-stone-500">
                Upload a JSON file containing raga rules to immediately train the AI.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>Select & Upload JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Registered Members */}
      {activeTab === 'members' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-stone-900">Raga Finder Family Members</h2>
              </div>
              <p className="text-xs text-stone-500">
                View all registered users (Mobile, Google Gmail, Microsoft, Email), notification delivery logs, and export member records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadMembers()}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 transition-colors flex items-center gap-1.5 border border-stone-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMembers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportMembersCsv}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Members (CSV)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl glass-panel border border-amber-200 bg-white/70">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Total Members</span>
              <span className="text-2xl font-black text-stone-900">{members.length}</span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-red-200 bg-white/70">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Google Accounts</span>
              <span className="text-2xl font-black text-red-600">
                {members.filter((m) => m.provider === 'google').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-blue-200 bg-white/70">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Microsoft Accounts</span>
              <span className="text-2xl font-black text-blue-600">
                {members.filter((m) => m.provider === 'microsoft').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-emerald-200 bg-white/70">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Mobile / Phone</span>
              <span className="text-2xl font-black text-emerald-600">
                {members.filter((m) => m.provider === 'mobile').length}
              </span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-stone-500 font-medium whitespace-nowrap">Filter Provider:</span>
              <select
                value={memberProviderFilter}
                onChange={(e) => setMemberProviderFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-stone-700"
              >
                <option value="all">All Providers ({members.length})</option>
                <option value="google">Google ({members.filter((m) => m.provider === 'google').length})</option>
                <option value="microsoft">Microsoft ({members.filter((m) => m.provider === 'microsoft').length})</option>
                <option value="mobile">Mobile ({members.filter((m) => m.provider === 'mobile').length})</option>
                <option value="email">Direct Email ({members.filter((m) => m.provider === 'email').length})</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-hidden rounded-2xl glass-panel border border-stone-200 bg-white/90 shadow-sm">
            {loadingMembers ? (
              <div className="p-12 text-center text-stone-400 text-sm">Loading registered members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-stone-500 space-y-2">
                <Users className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="font-semibold text-sm">No members found</p>
                <p className="text-xs text-stone-400">Try changing or clearing your search filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Member</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Sign Up Provider</th>
                      <th className="py-3.5 px-4">Welcome Notification</th>
                      <th className="py-3.5 px-4">Joined On</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`}
                              alt={member.name}
                              className="w-9 h-9 rounded-xl object-cover bg-amber-100 border border-amber-200 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-stone-900 block text-sm leading-tight">
                                {member.name}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400">ID: {member.id.slice(0, 10)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-700">
                          {member.email && (
                            <div className="flex items-center gap-1.5 text-stone-800">
                              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.mobile && (
                            <div className="flex items-center gap-1.5 text-stone-800">
                              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{member.mobile}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              member.provider === 'google'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : member.provider === 'microsoft'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : member.provider === 'mobile'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {member.provider === 'google' && 'Gmail (Google)'}
                            {member.provider === 'microsoft' && 'Microsoft'}
                            {member.provider === 'mobile' && 'Mobile OTP'}
                            {member.provider === 'email' && 'Direct Email'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              member.welcomeNotificationSent
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {member.welcomeNotificationSent ? 'Dispatched' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(member.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {member.email && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewEmailUser(member)}
                                  className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="View Greeting Email received by this member"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResendMemberEmail(member.id, member.name)}
                                  disabled={resendingEmailId === member.id}
                                  className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Resend Welcome Email to member"
                                >
                                  <Send className={`w-3.5 h-3.5 ${resendingEmailId === member.id ? 'animate-spin text-amber-600' : ''}`} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Email & Notifications */}
      {activeTab === 'email' && (
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-stone-900">
                  Welcome Email & Outbound Notification Hub
                </h2>
              </div>
              <p className="text-xs text-stone-500">
                Configure your outgoing mail server (Gmail SMTP with App Password, Custom SMTP, or Resend API) so that every new member receives an actual welcome email in their inbox.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  isEmailConfigured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isEmailConfigured ? 'Email Dispatch: Active' : 'Action Required: Setup Needed'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Email Configuration Form (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl glass-panel border border-stone-200 bg-white shadow-sm space-y-5">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Outbound Mail Configuration</h3>
                  <p className="text-[11px] text-stone-500">
                    Supports Gmail, Google Workspace, Outlook, or Resend REST API
                  </p>
                </div>
                <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                  Pure Node TLS
                </span>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Email Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailConfig({ ...emailConfig, provider: 'smtp', smtpHost: 'smtp.gmail.com', smtpPort: 465 })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      emailConfig.provider === 'smtp'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-stone-900 block">Gmail SMTP</span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Free &bull; 100% Inbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailConfig({ ...emailConfig, provider: 'resend' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      emailConfig.provider === 'resend'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-stone-900 block">Resend API</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">REST API Key</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailConfig({ ...emailConfig, provider: 'brevo' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      emailConfig.provider === 'brevo'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-stone-900 block">Brevo API</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">300 free/day</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveEmailConfig} className="space-y-4">
                {emailConfig.provider === 'smtp' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Sender Display Name
                        </label>
                        <input
                          type="text"
                          required
                          value={emailConfig.fromName || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                          placeholder="e.g. Raga Finder Family"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Sender Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={emailConfig.fromEmail || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                          placeholder="e.g. ragafinder.official@gmail.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          SMTP Username (Gmail ID)
                        </label>
                        <input
                          type="text"
                          required
                          value={emailConfig.smtpUser || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                          placeholder="yourname@gmail.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-stone-700">
                            Google App Password (16 chars)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPassword ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={emailConfig.smtpPass || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                          placeholder="abcd efgh ijkl mnop"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={emailConfig.smtpHost || 'smtp.gmail.com'}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          SMTP Port (SSL/TLS)
                        </label>
                        <input
                          type="number"
                          value={emailConfig.smtpPort || 465}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value, 10) })}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Step-by-Step Guide for Google App Password */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>How to get your free 16-character Google App Password (60 seconds):</span>
                      </div>
                      <ol className="list-decimal list-inside text-amber-950 space-y-1 text-[11px] leading-relaxed">
                        <li>Visit Google Security: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="underline font-semibold text-amber-900">myaccount.google.com/security</a></li>
                        <li>Ensure <strong>2-Step Verification</strong> is enabled on your Google account.</li>
                        <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900">myaccount.google.com/apppasswords</a>.</li>
                        <li>Type <strong>Raga Finder</strong> in the app name box and click <strong>Create</strong>.</li>
                        <li>Copy the 16-character code (e.g. <code>abcd efgh ijkl mnop</code>) and paste it into the password box above!</li>
                      </ol>
                    </div>
                  </>
                )}

                {emailConfig.provider === 'resend' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Resend API Key
                      </label>
                      <input
                        type="password"
                        required
                        value={emailConfig.resendApiKey || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                        placeholder="re_123456789..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Sender Email (Domain verified in Resend)
                      </label>
                      <input
                        type="email"
                        value={emailConfig.fromEmail || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        placeholder="e.g. welcome@yourdomain.com or onboarding@resend.dev"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                {emailConfig.provider === 'brevo' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Brevo API Key (v3)
                      </label>
                      <input
                        type="password"
                        required
                        value={emailConfig.brevoApiKey || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, brevoApiKey: e.target.value })}
                        placeholder="xkeysib-..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Sender Email (Validated in Brevo)
                      </label>
                      <input
                        type="email"
                        value={emailConfig.fromEmail || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        placeholder="yourname@gmail.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingEmailConfig}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{savingEmailConfig ? 'Saving Configuration...' : 'Save Email Configuration'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Live Email Tester (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl glass-panel border border-stone-200 bg-white shadow-sm space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-raga-600" />
                    <span>Send Live Test Email</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Type any email address and trigger an immediate live delivery check.
                  </p>
                </div>

                <form onSubmit={handleSendTestEmail} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Recipient Email ID
                    </label>
                    <input
                      type="email"
                      required
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      placeholder="Enter your personal email address..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testingEmail}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingEmail ? 'animate-spin' : ''}`} />
                    <span>{testingEmail ? 'Connecting & Transmitting...' : 'Send Live Test Email'}</span>
                  </button>
                </form>

                {/* Live Test Results Banner */}
                {emailTestResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2 animate-fadeIn ${
                      emailTestResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-red-50 border-red-300 text-red-950'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {emailTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block">
                          {emailTestResult.success ? 'Delivery Success!' : 'Delivery Failed'}
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed">
                          {emailTestResult.message || (emailTestResult as any).error}
                        </p>
                      </div>
                    </div>

                    {emailTestResult.log && emailTestResult.log.length > 0 && (
                      <details className="mt-2 text-[10px] text-stone-600 bg-white/80 p-2 rounded-xl border border-stone-200">
                        <summary className="font-mono cursor-pointer text-stone-700 font-bold">
                          View Server Transmission Logs ({emailTestResult.log.length} events)
                        </summary>
                        <pre className="mt-2 p-2 bg-stone-900 text-stone-100 rounded-lg overflow-x-auto text-[10px] font-mono leading-tight whitespace-pre-wrap max-h-40">
                          {emailTestResult.log.join('\n')}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Checklist Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 text-xs space-y-2">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Checklist</span>
                </h4>
                <ul className="space-y-1.5 text-amber-900 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Always check the <strong>Spam</strong> or <strong>Promotions</strong> folder if the email is not in Primary.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Subject line sent: <code>Welcome to Raga Finder Family, [Name]! 🎵</code></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Includes the royal banner: <strong>&ldquo;Thank You For Joining Raga Finder Family&rdquo;</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Greeting Email Preview Modal */}
      {previewEmailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl glass-panel shadow-2xl border-2 border-amber-300 bg-white overflow-hidden flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="p-4 px-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">Greeting Email Dispatched to {previewEmailUser.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailUser(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata */}
            <div className="p-4 px-6 bg-amber-50/70 border-b border-amber-200/80 text-left space-y-1">
              <h3 className="font-bold text-stone-900 text-sm">
                Welcome to Raga Finder Family, {previewEmailUser.name}! 🎵
              </h3>
              <div className="text-xs text-stone-600 flex flex-wrap items-center gap-4">
                <span><strong>To:</strong> {previewEmailUser.email || previewEmailUser.mobile}</span>
                <span><strong>From:</strong> Raga Finder Family &lt;welcome@ragafinder.com&gt;</span>
                <span className="text-emerald-700 font-semibold">&bull; Status: Delivered</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
              <div
                className="rounded-2xl shadow-sm border border-stone-200 overflow-hidden bg-white"
                dangerouslySetInnerHTML={{
                  __html:
                    previewEmailUser.emailPayload?.html ||
                    getWelcomeEmailHtml(previewEmailUser.name, previewEmailUser.email || 'Member'),
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 px-6 bg-white border-t border-stone-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewEmailUser(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
