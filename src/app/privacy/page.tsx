import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Raga Finder',
  description: 'Privacy Policy for Raga Finder - Carnatic & Hindustani Musicology application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Raga Finder
        </Link>
      </div>

      <div className="bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-2xl shadow-xl p-6 md:p-10 text-stone-800">
        <div className="flex items-center gap-3 mb-6 border-b border-amber-100 pb-5">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-700">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
              Privacy Policy
            </h1>
            <p className="text-sm text-stone-500">
              Effective Date: October 20, 2026 &bull; Raga Finder (com.ragafinder.app)
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm md:text-base leading-relaxed text-stone-700">
          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 1. Overview
            </h2>
            <p>
              Welcome to <strong>Raga Finder</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;). 
              Raga Finder is a dedicated Indian classical musicology reference tool designed to help musicians, 
              students, and music enthusiasts identify and explore Carnatic and Hindustani ragas, scales, 
              swaras, and classical compositions. Your privacy is paramount to us, and this Privacy Policy 
              explains how we handle data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 2. Information We Do NOT Collect
            </h2>
            <p className="mb-2">
              Raga Finder is designed with a strict privacy-first architecture:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-stone-600">
              <li>We do <strong>not</strong> require user registration or personal account creation to explore ragas.</li>
              <li>We do <strong>not</strong> track your precise GPS or location data.</li>
              <li>We do <strong>not</strong> access your contacts, camera, files, or sensitive device sensors.</li>
              <li>We do <strong>not</strong> sell, rent, or monetize personal user data to advertisers or third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 3. Data Stored Locally on Your Device
            </h2>
            <p>
              To provide a seamless experience, the App may store user preferences (such as selected swaras, 
              tradition preferences, custom raga bookmarks, or optional client AI keys) directly inside your 
              device&apos;s local storage. This information never leaves your device unless you explicitly 
              initiate an online search or sync.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 4. Audio Playback &amp; Radio Streaming
            </h2>
            <p>
              The App features an interactive swara keyboard synth and live Raga Radio stations. 
              Audio synthesis is generated locally via the Web Audio API on your device. Raga Radio streams 
              are routed securely via standard HTTPS network connections. No audio recorded from your 
              microphone is uploaded or stored.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 5. Third-Party Services
            </h2>
            <p>
              When using features like song lookup or AI-powered raga identification:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-stone-600">
              <li>Queries submitted for AI identification are processed securely using encrypted HTTPS endpoints.</li>
              <li>Embedded educational musical samples and radio stations comply with YouTube API Services terms where applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 6. Children&apos;s Privacy
            </h2>
            <p>
              Raga Finder is an educational musicology reference tool suitable for all ages. We do not knowingly 
              collect any personal identifiable information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" /> 7. Contact Us
            </h2>
            <p>
              If you have any questions, feedback, or inquiries regarding this Privacy Policy or the App, please reach out:
            </p>
            <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200 inline-flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-700" />
              <div>
                <p className="font-semibold text-stone-900">Developer Support</p>
                <a href="mailto:vaishnavnavi@gmail.com" className="text-amber-700 hover:underline">
                  vaishnavnavi@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
