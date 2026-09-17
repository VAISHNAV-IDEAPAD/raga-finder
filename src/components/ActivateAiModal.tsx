'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Zap,
  Trash2,
} from 'lucide-react';

interface ActivateAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
  initialSongQuery?: string;
}

export default function ActivateAiModal({
  isOpen,
  onClose,
  onActivated,
  initialSongQuery,
}: ActivateAiModalProps) {
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [isCurrentlyActive, setIsCurrentlyActive] = useState(false);

  // Sync state from localStorage & server on open
  useEffect(() => {
    if (!isOpen) return;

    const savedKey = localStorage.getItem('raga_ai_key') || '';
    const savedProvider = (localStorage.getItem('raga_ai_provider') as 'gemini' | 'openai') || 'gemini';
    const savedModel = localStorage.getItem('raga_ai_model') || '';

    setApiKey(savedKey);
    setProvider(savedProvider);
    setModel(savedModel || (savedProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'));
    setIsCurrentlyActive(Boolean(savedKey && savedKey.trim().length > 5));
    setTestResult(null);

    // Check if server already has environment key
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverHasKey) {
          setServerHasKey(true);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider);
    setModel(newProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
    setTestResult(null);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid API key.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          provider,
          model: model || (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save to localStorage
        localStorage.setItem('raga_ai_key', apiKey.trim());
        localStorage.setItem('raga_ai_provider', provider);
        localStorage.setItem('raga_ai_model', model || (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'));

        setIsCurrentlyActive(true);
        setTestResult({
          success: true,
          message: `${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} activated successfully! Ready to identify any song.`,
        });

        // Notify other components
        window.dispatchEvent(new Event('raga_ai_updated'));

        setTimeout(() => {
          if (onActivated) onActivated();
          onClose();
        }, 1200);
      } else {
        setTestResult({
          success: false,
          message: data.message || 'API key verification failed. Please check your key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error connecting to verification server.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem('raga_ai_key');
    localStorage.removeItem('raga_ai_provider');
    localStorage.removeItem('raga_ai_model');
    setApiKey('');
    setIsCurrentlyActive(false);
    setTestResult({
      success: true,
      message: 'AI key removed. Switched to offline database.',
    });
    window.dispatchEvent(new Event('raga_ai_updated'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl glass-panel shadow-2xl border-2 border-amber-300 bg-white/95 overflow-hidden transition-all">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-raga-500 flex items-center justify-center text-stone-950 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Activate AI Musicologist</span>
                {isCurrentlyActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-stone-950 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" /> Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-amber-200/80">
                Identify Ragas for ANY song not in the offline database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {initialSongQuery && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-stone-700 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-raga-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900">Identifying &ldquo;{initialSongQuery}&rdquo;:</span>
                <p className="text-stone-600 mt-0.5">
                  Activate AI below and we will automatically identify this song&apos;s raga, arohana, avarohana, and classical analysis!
                </p>
              </div>
            </div>
          )}

          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Select AI Engine:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  provider === 'gemini'
                    ? 'bg-gradient-to-r from-amber-500 to-raga-600 text-white shadow-md'
                    : 'text-stone-700 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Google Gemini (Free)</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  provider === 'openai'
                    ? 'bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-md'
                    : 'text-stone-700 hover:bg-white/60'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>OpenAI GPT</span>
              </button>
            </div>
          </div>

          {/* Info Banner on how to get API Key */}
          {provider === 'gemini' ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  100% Free & Fast (Recommended)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                >
                  <span>Get Free Key (30s)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Google AI Studio provides a free API key with no credit card required. Supports Gemini 2.0 Flash with sub-second response times!
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-stone-600" />
                  OpenAI GPT-4o / GPT-4o-mini
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline inline-flex items-center gap-1"
                >
                  <span>Get OpenAI Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Enter your standard OpenAI API key starting with &ldquo;sk-...&rdquo;.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                {provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'} *
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 pr-10 text-sm font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Your key is stored securely in your browser&apos;s local storage and sent only to identify ragas.
              </p>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                AI Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {provider === 'gemini' ? (
                  <>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended & Ultra-Fast)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-Efficient)</option>
                    <option value="gpt-4o">gpt-4o (High-Precision Flagship)</option>
                  </>
                )}
              </select>
            </div>

            {/* Test Result Notice */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2 animate-fadeIn ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {isCurrentlyActive ? (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Deactivate Key</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!apiKey.trim() || isTesting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-raga-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Activate & Save Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
