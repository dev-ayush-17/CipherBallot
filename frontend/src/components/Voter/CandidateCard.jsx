import { useMemo } from 'react';

/*
 * CandidateCard — Detailed Matrix Candidate Card
 * Supports two layout variants based on whether the candidate is an incumbent:
 *   1. Featured Incumbent (Horizontal layout, side-by-side portrait and details)
 *   2. Challenger (Vertical layout, portrait on top, details below)
 *
 * Props:
 *   - candidate: { id, name, department, role, cgpa, manifesto, tags, portraitUrl, isIncumbent, isActive }
 *   - onVote: (candidate) => void — triggers vote modal / audit confirmation
 *   - hasVoted: boolean
 *   - disabled: boolean
 */

export default function CandidateCard({ candidate, onVote, hasVoted, disabled }) {
  /* ─── Greyscale portrait fallback if image fails ─── */
  const portraitFallback = (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-terminal-black/10">
      <svg className="w-16 h-16 text-terminal-grey/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    </div>
  );

  if (candidate.isIncumbent) {
    /* ─── 1. Featured Incumbent Card Layout ─── */
    return (
      <div className="protocol-card bg-white p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in md:col-span-2">
        {/* Left: Greyscale Portrait */}
        <div className="h-64 md:h-full relative overflow-hidden border border-terminal-black">
          {candidate.portraitUrl ? (
            <img
              src={candidate.portraitUrl}
              alt={candidate.name}
              className="w-full h-full object-cover grayscale contrast-125 brightness-95"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : portraitFallback}
        </div>

        {/* Right: Details & Metadata */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="relative">
            {/* Green Selection Checkmark Badge */}
            <div className="absolute top-0 right-0">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-status-active border border-status-active/30">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>

            <p className="text-[10px] font-bold text-protocol-blue uppercase tracking-protocol">
              {candidate.role || 'Incumbent / District 04'}
            </p>
            <h3 className="font-brand font-black text-2xl mt-1 text-terminal-black">
              {candidate.name}
            </h3>
            <p className="text-xs font-semibold text-status-active mt-1">
              CGPA: {candidate.cgpa || '3.92 / 4.00'}
            </p>
          </div>

          <div>
            <p className="protocol-label text-[9px] mb-1">Manifesto Snippet</p>
            <p className="text-xs text-terminal-grey italic leading-relaxed">
              {candidate.manifesto || '"Our future depends on the resilience of our decentralized energy grid."'}
            </p>
          </div>

          {/* Stance Tags */}
          <div className="flex flex-wrap gap-2">
            {(candidate.tags || ['Economy / Resilience+', 'Rights / Privacy First']).map((tag, idx) => {
              const [category, val] = tag.split(' / ');
              return (
                <div key={idx} className="border border-terminal-black/20 px-3 py-1 bg-gray-50 flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider text-terminal-grey">{category}</span>
                  <span className="text-[10px] font-bold text-terminal-black">{val}</span>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => onVote(candidate)}
            disabled={hasVoted || disabled}
            className="w-full btn-protocol-primary py-3 text-xs"
          >
            {hasVoted ? 'Ballot Cast' : 'Review Full Audit'}
          </button>
        </div>
      </div>
    );
  }

  /* ─── 2. Challenger Card Layout ─── */
  return (
    <div className="protocol-card bg-white p-5 flex flex-col justify-between gap-5 animate-fade-in">
      {/* Top: Greyscale Portrait */}
      <div className="h-48 relative overflow-hidden border border-terminal-black">
        {candidate.portraitUrl ? (
          <img
            src={candidate.portraitUrl}
            alt={candidate.name}
            className="w-full h-full object-cover grayscale contrast-125 brightness-95"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : portraitFallback}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[9px] font-bold text-terminal-grey uppercase tracking-protocol">
            {candidate.role || 'Challenger / District 04'}
          </p>
          <h3 className="font-brand font-black text-xl mt-0.5 text-terminal-black">
            {candidate.name}
          </h3>
          <p className="text-xs font-semibold text-protocol-blue mt-0.5">
            CGPA: {candidate.cgpa || '3.88 / 4.00'}
          </p>
        </div>

        <p className="text-xs text-terminal-grey italic leading-relaxed line-clamp-3">
          {candidate.manifesto}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onVote(candidate)}
        disabled={hasVoted || disabled}
        className="w-full btn-protocol-secondary py-3 text-xs"
      >
        Compare Profiles
      </button>
    </div>
  );
}

