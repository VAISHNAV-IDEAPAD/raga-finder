import Link from 'next/link';
import { Heart, Sparkles, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-amber-200/60 bg-stone-900 text-stone-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-amber-400">RagaFinder AI</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Next.js & Vercel
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              An intelligent Indian classical raga discovery engine powered by OpenAI with
              continuous musicologist admin ground-truth training and precision swara synthesis.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
              Musicology Systems
            </h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>Carnatic: 72 Melakarta Katapayadi System</li>
              <li>Hindustani: 10 Bhatkhande Thaats</li>
              <li>Arohana / Avarohana & Vakra Janya Ragas</li>
              <li>Vadi, Samvadi & Rasa Theory</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
              Administration & Teaching
            </h3>
            <p className="text-sm text-stone-400 mb-3">
              Musicologists and admins can review errors, teach the AI disambiguation rules, and adjust model prompts.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Open Admin Teaching Portal
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 text-xs text-stone-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            Crafted for classical musicians, students, and connoisseurs. Ready for zero-config Vercel deployment.
          </p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-stone-300 font-medium">OpenAI</span>
            <span>&</span>
            <span className="text-amber-400 font-medium">Web Audio API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
