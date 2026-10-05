import React, { useState, useEffect } from 'react';
import { RandomizerCommitment, NistPulse, ShiftsPayload, GroupsPayload } from '../types';
import {
  Lock,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Zap,
  Info,
  Users,
  Calendar,
  MessageSquare,
  Send,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchNistPulseByTime, formatDualTime } from '../lib/nistBeacon';

interface CountdownViewProps {
  commitment: RandomizerCommitment;
  onPulseReady: (pulse: NistPulse) => void;
  onSimulateWithLatestPulse: () => void;
  isSimulating: boolean;
}

export const CountdownView: React.FC<CountdownViewProps> = ({
  commitment,
  onPulseReady,
  onSimulateWithLatestPulse,
  isSimulating,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() =>
    Math.max(0, commitment.targetTimestampMs - Date.now())
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);
  const [isFetchingPulse, setIsFetchingPulse] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fetchStatusMsg, setFetchStatusMsg] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Trigger pulse fetch using the central nistBeacon client
  const triggerFetchPulse = async () => {
    setIsFetchingPulse(true);
    setFetchStatusMsg('Target time reached! Querying NIST Randomness Beacon 2.0...');

    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      attempts++;
      setRetryCount(attempts);
      const res = await fetchNistPulseByTime(commitment.targetTimestampMs);

      if (res.success && res.pulse) {
        setIsFetchingPulse(false);
        setFetchStatusMsg(null);
        onPulseReady(res.pulse);
        return;
      }

      if (attempts < maxAttempts) {
        setFetchStatusMsg(
          `NIST pulse emitted at :00. Awaiting public server synchronization... (Attempt ${attempts}/${maxAttempts})`
        );
        setTimeout(poll, 3000);
      } else {
        setIsFetchingPulse(false);
        setFetchStatusMsg(
          'NIST Beacon publication is taking longer than expected. You can click "Check Pulse Now" or use "Test Reveal with Latest Pulse".'
        );
      }
    };

    poll();
  };

  // Countdown timer effect
  useEffect(() => {
    // If target timestamp has already arrived upon mounting, fetch immediately
    if (commitment.targetTimestampMs <= Date.now()) {
      setTimeLeftMs(0);
      triggerFetchPulse();
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = commitment.targetTimestampMs - now;
      setTimeLeftMs(Math.max(0, diff));

      if (diff <= 0) {
        clearInterval(timer);
        triggerFetchPulse();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [commitment.targetTimestampMs]);

  // Generate formatted group message
  const targetDate = new Date(commitment.targetTimestampMs);
  const shareMessage = `🏥 *${commitment.title}*\n` +
    `🔒 *Tamper-Proof Randomization Committed*\n` +
    `🎲 *NIST Pulse Time:* ${formatDualTime(targetDate)}\n` +
    `🔑 *SHA-256 Fingerprint:* ${commitment.paramsHash.slice(0, 16)}...\n\n` +
    `Open link to watch live countdown & verify the result:\n` +
    `${window.location.href}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(commitment.paramsHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyAnnouncement = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopiedAnnouncement(true);
    setTimeout(() => setCopiedAnnouncement(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: commitment.title,
          text: shareMessage,
          url: window.location.href,
        });
      } catch (e) {
        // User cancelled share
      }
    } else {
      setShowShareOptions(prev => !prev);
    }
  };

  // Time components
  const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

  // Metadata summary
  let studentCount = 0;
  if ('candidates' in commitment.payload) {
    studentCount = (commitment.payload as ShiftsPayload | GroupsPayload).candidates.length;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Main Locked Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0b1226] to-[#070c18] border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges & Share Trigger */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">Awaiting Future Pulse</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-xs font-semibold text-teal-300 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share with Group</span>
            </button>
          </div>
        </div>

        {/* Share Options Drawer */}
        {showShareOptions && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span>Send announcement directly to your group app:</span>
              <button
                onClick={() => setShowShareOptions(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755]/25 border border-[#06C755]/30 text-[#06C755] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>LINE</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(commitment.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
              <button
                onClick={handleCopyAnnouncement}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedAnnouncement ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAnnouncement ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          {commitment.title}
        </h1>
        {commitment.creatorName && (
          <p className="text-xs text-slate-400 mb-6">
            Committed by <span className="text-slate-200 font-semibold">{commitment.creatorName}</span>
          </p>
        )}

        {/* Big Countdown Clocks */}
        <div className="my-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto">
            {/* Hours */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
              <span className="text-3xl sm:text-5xl font-mono font-extrabold text-teal-400">
                {String(hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-mono mt-1">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
              <span className="text-3xl sm:text-5xl font-mono font-extrabold text-teal-400">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-mono mt-1">
                Minutes
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
              <span className="text-3xl sm:text-5xl font-mono font-extrabold text-emerald-400">
                {String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-mono mt-1">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Pulse Target Info Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center text-xs space-y-1">
          <div className="text-slate-400">
            Random seed will be generated from NIST Beacon 2.0 pulse at:
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {format(targetDate, 'yyyy-MM-dd HH:mm:00')} Local
            <span className="text-xs text-slate-400 font-normal ml-2">
              ({targetDate.toUTCString().slice(17, 25)} UTC)
            </span>
          </div>
        </div>

        {/* Active Fetching / Waiting indicator */}
        {isFetchingPulse && (
          <div className="mt-4 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3 text-teal-300 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span>{fetchStatusMsg || 'Synchronizing with NIST Beacon 2.0...'}</span>
            </div>
            <button
              onClick={triggerFetchPulse}
              className="p-1 text-teal-400 hover:text-white"
              title="Manual retry"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </button>
          </div>
        )}

        {/* Fast-Forward / Demo Mode */}
        <div className="mt-6 pt-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Presenting to your peers or running a test?
          </span>
          <button
            type="button"
            disabled={isSimulating}
            onClick={onSimulateWithLatestPulse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium transition-colors shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isSimulating ? 'Querying NIST...' : 'Test Reveal with Latest Pulse'}</span>
          </button>
        </div>
      </div>

      {/* Locked Parameters Card */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-400" />
          <span>Locked Configuration Roster</span>
          {studentCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 font-mono">
              {studentCount} students
            </span>
          )}
        </h3>

        {/* SHA-256 Fingerprint */}
        <div>
          <div className="text-xs text-slate-400 mb-1.5">Pre-Commitment SHA-256 Fingerprint:</div>
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 break-all">
            <span className="flex-1">{commitment.paramsHash}</span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-slate-400 leading-relaxed text-xs">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 font-semibold">Why is this result completely tamper-proof?</strong>
            <p className="mt-1">
              The student names and shift rules were mathematically committed in this URL before the future pulse occurred. At {format(targetDate, 'HH:mm:00')}, the quantum-photonic NIST Beacon will release a 512-bit signed value that cannot be influenced or predicted by any individual on Earth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
