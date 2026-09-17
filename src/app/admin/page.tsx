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
} from 'lucide-react';
import { AdminRule, MistakeReport, IdentifyResponse } from '@/types/raga';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'rules' | 'reports' | 'playground' | 'backup'>('rules');

  // Rules state
  const [rules, setRules] = useState<AdminRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AdminRule> | null>(null);

  // Reports state
  const [reports, setReports] = useState<MistakeReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

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
    </div>
  );
}
