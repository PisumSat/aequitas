import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AllocationMode,
  RandomizerCommitment,
  NistPulse,
  ShiftsPayload,
  GroupsPayload,
  OrderPayload,
  LotteryPayload,
  RangePayload,
} from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ModeSelector } from './components/ModeSelector';
import { ShiftConfig } from './components/ShiftConfig';
import { GroupConfig } from './components/GroupConfig';
import { SequenceConfig } from './components/SequenceConfig';
import { LotteryConfig } from './components/LotteryConfig';
import { RangeConfig } from './components/RangeConfig';
import { CommitmentPicker } from './components/CommitmentPicker';
import { CountdownView } from './components/CountdownView';
import { ResultView } from './components/ResultView';
import { VerificationModal } from './components/VerificationModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import {
  canonicalJson,
  sha256,
  deriveCombinedSeed,
  encodeCommitmentToUrl,
  decodeCommitmentFromUrl,
} from './lib/crypto';
import { DeterministicPRNG } from './lib/prng';
import {
  allocateShifts,
  allocateGroups,
  allocateOrder,
  allocateLottery,
  allocateRange,
} from './lib/allocators';
import {
  fetchLatestNistPulse,
  fetchNistPulseByTime,
  snapToNistMinute,
} from './lib/nistBeacon';
import {
  SAMPLE_STUDENTS,
  SAMPLE_SHIFTS,
  SAMPLE_GROUPS,
  SAMPLE_TOPICS,
} from './lib/sampleData';
import { format, addDays, addMinutes } from 'date-fns';
import { ShieldCheck } from 'lucide-react';

export function App() {
  // Live beacon state
  const [latestPulse, setLatestPulse] = useState<NistPulse | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // App mode: builder vs viewing commitment
  const [activeMode, setActiveMode] = useState<AllocationMode>('shifts');
  const [title, setTitle] = useState('October 2026 Medical Duty Allocation');
  const [creatorName, setCreatorName] = useState('');
  const [targetTimestampMs, setTargetTimestampMs] = useState<number>(() =>
    snapToNistMinute(addMinutes(new Date(), 15).getTime())
  );

  // Payloads for each mode
  const [shiftsPayload, setShiftsPayload] = useState<ShiftsPayload>({
    candidates: SAMPLE_STUDENTS,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 13), 'yyyy-MM-dd'),
    shifts: SAMPLE_SHIFTS,
    preventConsecutiveNights: true,
    balanceWeekends: true,
  });

  const [groupsPayload, setGroupsPayload] = useState<GroupsPayload>({
    candidates: SAMPLE_STUDENTS,
    groupNames: SAMPLE_GROUPS,
    balanceSizes: true,
  });

  const [orderPayload, setOrderPayload] = useState<OrderPayload>({
    items: SAMPLE_TOPICS,
    startTime: '08:30',
    intervalMinutes: 15,
  });

  const [lotteryPayload, setLotteryPayload] = useState<LotteryPayload>({
    candidates: SAMPLE_STUDENTS,
    pickCount: 3,
    allowDuplicates: false,
  });

  const [rangePayload, setRangePayload] = useState<RangePayload>({
    min: 1,
    max: 100,
    count: 5,
    unique: true,
  });

  // Active commitment state
  const [commitment, setCommitment] = useState<RandomizerCommitment | null>(null);
  const [pulse, setPulse] = useState<NistPulse | null>(null);
  const [combinedSeedHex, setCombinedSeedHex] = useState<string | null>(null);
  const [allocationResultData, setAllocationResultData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Resolve commitment by fetching target NIST pulse and running the deterministic allocator
  const resolveCommitment = useCallback(async (
    targetCommitment: RandomizerCommitment,
    overridePulse?: NistPulse
  ) => {
    try {
      let resolvedPulse = overridePulse;

      if (!resolvedPulse) {
        const fetchRes = await fetchNistPulseByTime(targetCommitment.targetTimestampMs);
        if (fetchRes.success && fetchRes.pulse) {
          resolvedPulse = fetchRes.pulse;
        } else {
          return;
        }
      }

      setPulse(resolvedPulse);

      // Derive combined seed: SHA256(NIST_PULSE + PARAMS_HASH)
      const seedHex = await deriveCombinedSeed(
        resolvedPulse.outputValue,
        targetCommitment.paramsHash
      );
      setCombinedSeedHex(seedHex);

      // Execute deterministic PRNG
      const prng = new DeterministicPRNG(seedHex);

      let result: any = null;
      switch (targetCommitment.mode) {
        case 'shifts':
          result = allocateShifts(targetCommitment.payload as ShiftsPayload, prng);
          break;
        case 'groups':
          result = allocateGroups(targetCommitment.payload as GroupsPayload, prng);
          break;
        case 'order':
          result = allocateOrder(targetCommitment.payload as OrderPayload, prng);
          break;
        case 'lottery':
          result = allocateLottery(targetCommitment.payload as LotteryPayload, prng);
          break;
        case 'range':
          result = allocateRange(targetCommitment.payload as RangePayload, prng);
          break;
      }

      setAllocationResultData(result);

      // Trigger celebratory confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#6366f1', '#10b981', '#f59e0b'],
      });
    } catch (err) {
      console.error('Failed to resolve commitment', err);
    }
  }, []);

  // 1. Initial URL check for commitment hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#commit=') || hash.startsWith('#data=')) {
        const raw = hash.replace(/^#(commit|data)=/, '');
        const decoded = decodeCommitmentFromUrl(raw);
        if (decoded) {
          setCommitment(decoded);
          if (decoded.targetTimestampMs <= Date.now()) {
            resolveCommitment(decoded);
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [resolveCommitment]);

  // 2. Poll for latest NIST Beacon pulse every 45s for the live status badge
  useEffect(() => {
    const fetchPulse = async () => {
      const p = await fetchLatestNistPulse();
      if (p) setLatestPulse(p);
    };

    fetchPulse();
    const interval = setInterval(fetchPulse, 45000);
    return () => clearInterval(interval);
  }, []);

  // Submit commitment from builder
  const handleCreateCommitment = async () => {
    let currentPayload: any;
    switch (activeMode) {
      case 'shifts':
        currentPayload = shiftsPayload;
        break;
      case 'groups':
        currentPayload = groupsPayload;
        break;
      case 'order':
        currentPayload = orderPayload;
        break;
      case 'lottery':
        currentPayload = lotteryPayload;
        break;
      case 'range':
        currentPayload = rangePayload;
        break;
    }

    const canonicalString = canonicalJson(currentPayload);
    const paramsHash = await sha256(canonicalString);

    const newCommitment: RandomizerCommitment = {
      v: 1,
      id: `alloc-${Date.now().toString(36)}`,
      title: title.trim() || 'Verifiable Allocation',
      creatorName: creatorName.trim() || undefined,
      mode: activeMode,
      targetPulseIso: new Date(targetTimestampMs).toISOString(),
      targetTimestampMs,
      createdAtIso: new Date().toISOString(),
      paramsHash,
      payload: currentPayload,
    };

    const encoded = encodeCommitmentToUrl(newCommitment);
    window.location.hash = `#commit=${encoded}`;
    setCommitment(newCommitment);

    if (targetTimestampMs <= Date.now()) {
      resolveCommitment(newCommitment);
    }
  };

  // Fast-forward simulation handler using latest live NIST pulse
  const handleSimulateWithLatest = async () => {
    if (!commitment) return;
    setIsSimulating(true);

    let testPulse = latestPulse;
    if (!testPulse) {
      testPulse = await fetchLatestNistPulse();
    }

    if (!testPulse) {
      testPulse = {
        uri: 'https://beacon.nist.gov/beacon/2.0/pulse/simulated',
        version: '2.0-sim',
        pulseIndex: 1943700,
        timeStamp: new Date().toISOString(),
        outputValue: '7FA28D965AA55A83C63DA57E7F09A105115913729894018305C2C11B50EB0A02120B41ECCC8D9312592531FBB1368B11C4485678000830DE0BA3977225536325',
        signatureValue: 'SIMULATED_SIGNATURE_NIST_BEACON_DEMO',
        certificateId: 'nist-demo-cert',
        statusCode: 0,
      };
    }

    await resolveCommitment(commitment, testPulse);
    setIsSimulating(false);
  };

  const handleReset = () => {
    window.history.pushState(null, '', window.location.pathname);
    setCommitment(null);
    setPulse(null);
    setCombinedSeedHex(null);
    setAllocationResultData(null);
  };

  // Validation
  let isValid = true;
  let validationError = '';
  if (activeMode === 'shifts' && shiftsPayload.candidates.length === 0) {
    isValid = false;
    validationError = 'Please add at least one candidate to the roster.';
  } else if (activeMode === 'groups' && groupsPayload.candidates.length === 0) {
    isValid = false;
    validationError = 'Please add student candidates for group distribution.';
  } else if (activeMode === 'order' && orderPayload.items.length === 0) {
    isValid = false;
    validationError = 'Please add items or presentation topics.';
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-teal-500/20 selection:text-teal-300">
      <div>
        <Header
          latestPulse={latestPulse}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onReset={handleReset}
          isViewingCommitment={!!commitment}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          {/* VIEW 1: POST-PULSE RESOLVED RESULT */}
          {commitment && pulse && combinedSeedHex && allocationResultData ? (
            <ResultView
              commitment={commitment}
              pulse={pulse}
              combinedSeedHex={combinedSeedHex}
              resultData={allocationResultData}
              onOpenAudit={() => setIsAuditModalOpen(true)}
            />
          ) : /* VIEW 2: PRE-PULSE LOCKED COUNTDOWN */
          commitment ? (
            <CountdownView
              commitment={commitment}
              onPulseReady={p => resolveCommitment(commitment, p)}
              onSimulateWithLatestPulse={handleSimulateWithLatest}
              isSimulating={isSimulating}
            />
          ) : (
            /* VIEW 3: INTERACTIVE BUILDER */
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="text-center max-w-3xl mx-auto pt-4 pb-6 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>NIST Randomness Beacon 2.0 Integration</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Zero-Trust Public Randomization for Medical Rota & Rotations
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Allocate night shifts, ward groups, and viva speaking orders with absolute mathematical fairness.
                  Commit your roster now, lock the parameters in the URL, and let the U.S. NIST Beacon generate the unguessable future seed.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Select Allocation Mode
                </label>
                <ModeSelector
                  selectedMode={activeMode}
                  onSelectMode={setActiveMode}
                />
              </div>

              {/* Config Form depending on active mode */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  {activeMode === 'shifts' && (
                    <ShiftConfig
                      payload={shiftsPayload}
                      onChange={setShiftsPayload}
                    />
                  )}
                  {activeMode === 'groups' && (
                    <GroupConfig
                      payload={groupsPayload}
                      onChange={setGroupsPayload}
                    />
                  )}
                  {activeMode === 'order' && (
                    <SequenceConfig
                      payload={orderPayload}
                      onChange={setOrderPayload}
                    />
                  )}
                  {activeMode === 'lottery' && (
                    <LotteryConfig
                      payload={lotteryPayload}
                      onChange={setLotteryPayload}
                    />
                  )}
                  {activeMode === 'range' && (
                    <RangeConfig
                      payload={rangePayload}
                      onChange={setRangePayload}
                    />
                  )}
                </div>

                {/* Right Column: Future Target Commitment Picker */}
                <div className="lg:col-span-5 sticky top-24">
                  <CommitmentPicker
                    title={title}
                    onTitleChange={setTitle}
                    creatorName={creatorName}
                    onCreatorNameChange={setCreatorName}
                    targetTimestampMs={targetTimestampMs}
                    onTargetTimestampChange={setTargetTimestampMs}
                    onSubmitCommitment={handleCreateCommitment}
                    isValid={isValid}
                    validationError={validationError}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {commitment && pulse && combinedSeedHex && (
        <VerificationModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          commitment={commitment}
          pulse={pulse}
          combinedSeedHex={combinedSeedHex}
        />
      )}

      {/* Footer with Pisum credit & keenthekeen inspiration */}
      <Footer />
    </div>
  );
}

export default App;
