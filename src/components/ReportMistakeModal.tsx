'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { IdentifyResponse } from '@/types/raga';

interface ReportMistakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: any;
  aiResult: IdentifyResponse['raga'];
  onSuccess?: () => void;
}

export default function ReportMistakeModal({
  isOpen,
  onClose,
  query,
  aiResult,
  onSuccess,
}: ReportMistakeModalProps) {
  const [correctRaga, setCorrectRaga] = useState('');
  const [correctSwaras, setCorrectSwaras] = useState(aiResult?.arohana || '');
  const [explanation, setExplanation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctRaga.trim()) {
      setErrorMsg('Please specify the correct raga name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/report-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          aiSuggestedRaga: aiResult.name,
          userCorrection: {
            correctRaga: correctRaga.trim(),
            correctSwaras: correctSwaras.trim(),
            notesOrExplanation: explanation.trim(),
            reporterName: reporterName.trim() || 'Contributor',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Teach the AI / Report Mistake
              </h3>
              <p className="text-xs text-stone-500">
                Help refine the musicology engine for future searches
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-stone-900">Thank You! Correction Submitted</h4>
              <p className="text-sm text-stone-600">
                Your report has been submitted to the Admin Teaching Queue. The admin will verify
                and teach OpenAI the ground-truth rule.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-stone-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">AI Suggested:</span>
                  <span className="font-bold text-stone-900">{aiResult.name}</span>
                </div>
                {aiResult.tradition && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Tradition:</span>
                    <span className="font-medium text-stone-800">{aiResult.tradition}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  What is the Correct Raga? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mayamalavagowla, Keeravani, Ahir Bhairav..."
                  value={correctRaga}
                  onChange={(e) => setCorrectRaga(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Correct Swaras / Arohana-Avarohana (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. S R1 G3 M1 P D1 N3 S' / S' N3 D1 P M1 G3 R1 S"
                  value={correctSwaras}
                  onChange={(e) => setCorrectSwaras(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Why was the AI mistaken? (Musicology explanation)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. The query uses Teevra Ma (M2), so it cannot be Keeravani (which requires M1). It must be Simhendramadhyamam..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Your Name or Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vidwan / Music Student / Admin"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Correction to Admin'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
