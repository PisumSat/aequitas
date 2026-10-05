import {
  ShiftsPayload,
  GroupsPayload,
  OrderPayload,
  LotteryPayload,
  RangePayload,
  ShiftAllocationResult,
  GroupAllocationResult,
  OrderAllocationResult,
  LotteryAllocationResult,
  RangeAllocationResult,
  ShiftDateSlot,
} from '../types';
import { DeterministicPRNG } from './prng';
import { addDays, format, parseISO } from 'date-fns';

/**
 * Normalizes and cleans candidate rosters:
 * Strips numbering (e.g. "1. Alice", "2) Bob"), removes duplicates, and trims whitespace.
 */
export function cleanCandidatesList(rawList: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of rawList) {
    // Strip leading numbers like "1. ", "01) ", "- ", "* ", "[1] "
    const cleaned = item
      .replace(/^(\d+[\.\)\-:]|\*|\-|\[\d+\])\s*/, '')
      .trim();

    if (cleaned.length > 0 && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * Deterministically allocates medical student shifts across dates and shift duties
 */
export function allocateShifts(
  payload: ShiftsPayload,
  prng: DeterministicPRNG
): ShiftAllocationResult {
  const candidates = cleanCandidatesList(payload.candidates);
  const {
    startDate,
    endDate,
    shifts,
    preventConsecutiveNights = true,
    balanceWeekends = true,
  } = payload;

  if (candidates.length === 0 || shifts.length === 0) {
    return { schedule: [], studentStats: [] };
  }

  // Parse date range safely
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  let totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (isNaN(totalDays) || totalDays < 1) {
    totalDays = 1;
  }

  // Initialize student workload counters
  interface CandidateWorkload {
    name: string;
    totalShifts: number;
    nightShifts: number;
    weekendShifts: number;
    lastNightShiftDayIndex: number;
    lastWorkedDayIndex: number;
  }

  const workloads: Map<string, CandidateWorkload> = new Map();
  candidates.forEach(name => {
    workloads.set(name, {
      name,
      totalShifts: 0,
      nightShifts: 0,
      weekendShifts: 0,
      lastNightShiftDayIndex: -99,
      lastWorkedDayIndex: -99,
    });
  });

  const schedule: ShiftDateSlot[] = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDate = addDays(start, dayIndex);
    const dateIso = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = format(currentDate, 'EEE');
    const dayNum = currentDate.getDay();
    const isWeekend = dayNum === 0 || dayNum === 6; // Sunday or Saturday

    const daySlots: ShiftDateSlot['shifts'] = [];

    // Process each shift type
    for (const shiftDef of shifts) {
      for (let slot = 0; slot < (shiftDef.slotsPerDay || 1); slot++) {
        const isNight = shiftDef.category === 'night';

        // Shuffle candidate pool deterministically for unbiased tie-breaking
        const shuffledPool = prng.shuffle(candidates);

        // Sort candidates based on medical roster fairness criteria:
        const sorted = [...shuffledPool].sort((a, b) => {
          const statA = workloads.get(a)!;
          const statB = workloads.get(b)!;

          // 1. Strict Circadian Protection: Avoid consecutive night shifts
          if (preventConsecutiveNights) {
            if (isNight) {
              // If student worked a night shift yesterday, heavily deprioritize them for tonight
              const aConsecutiveNight = statA.lastNightShiftDayIndex === dayIndex - 1 ? 1 : 0;
              const bConsecutiveNight = statB.lastNightShiftDayIndex === dayIndex - 1 ? 1 : 0;
              if (aConsecutiveNight !== bConsecutiveNight) {
                return aConsecutiveNight - bConsecutiveNight;
              }
            } else {
              // Post-call protection: If student worked a night shift last night, avoid day shift today
              const aPostCall = statA.lastNightShiftDayIndex === dayIndex - 1 ? 1 : 0;
              const bPostCall = statB.lastNightShiftDayIndex === dayIndex - 1 ? 1 : 0;
              if (aPostCall !== bPostCall) {
                return aPostCall - bPostCall;
              }
            }
          }

          // 2. Total Workload Equity: Give shifts to students with fewest total assignments
          if (statA.totalShifts !== statB.totalShifts) {
            return statA.totalShifts - statB.totalShifts;
          }

          // 3. Weekend Shift Balance: Fair distribution of Saturday/Sunday on-call duties
          if (balanceWeekends && isWeekend) {
            if (statA.weekendShifts !== statB.weekendShifts) {
              return statA.weekendShifts - statB.weekendShifts;
            }
          }

          // 4. Night Duty Balance: Equal distribution of nocturnal shifts
          if (isNight && statA.nightShifts !== statB.nightShifts) {
            return statA.nightShifts - statB.nightShifts;
          }

          return 0;
        });

        // Find candidate not already assigned to another shift on this exact day
        const assignedToday = daySlots.map(s => s.assignedCandidate).filter(Boolean);
        const bestCandidate = sorted.find(c => !assignedToday.includes(c)) || sorted[0];

        // Update workload counters
        const candStat = workloads.get(bestCandidate)!;
        candStat.totalShifts += 1;
        candStat.lastWorkedDayIndex = dayIndex;
        if (isNight) {
          candStat.nightShifts += 1;
          candStat.lastNightShiftDayIndex = dayIndex;
        }
        if (isWeekend) {
          candStat.weekendShifts += 1;
        }

        daySlots.push({
          shiftId: shiftDef.id,
          slotIndex: slot,
          assignedCandidate: bestCandidate,
        });
      }
    }

    schedule.push({
      dateIso,
      dayOfWeek,
      isWeekend,
      shifts: daySlots,
    });
  }

  const studentStats = Array.from(workloads.values()).map(w => ({
    name: w.name,
    totalShifts: w.totalShifts,
    nightShifts: w.nightShifts,
    weekendShifts: w.weekendShifts,
  }));

  return { schedule, studentStats };
}

/**
 * Deterministically splits candidates into balanced clinical teams or ward groups
 */
export function allocateGroups(
  payload: GroupsPayload,
  prng: DeterministicPRNG
): GroupAllocationResult {
  const candidates = cleanCandidatesList(payload.candidates);
  const { groupNames } = payload;
  const groups = groupNames.map(name => ({ name, members: [] as string[] }));

  if (candidates.length === 0 || groups.length === 0) {
    return { groups };
  }

  // Shuffle candidates deterministically
  const shuffled = prng.shuffle(candidates);

  // Distribute round-robin to ensure balanced team sizes
  shuffled.forEach((student, index) => {
    const groupIdx = index % groups.length;
    groups[groupIdx].members.push(student);
  });

  return { groups };
}

/**
 * Deterministically orders candidates/presentations and assigns optional time slots
 */
export function allocateOrder(
  payload: OrderPayload,
  prng: DeterministicPRNG
): OrderAllocationResult {
  const items = cleanCandidatesList(payload.items);
  const { startTime = '08:30', intervalMinutes = 15 } = payload;

  const shuffled = prng.shuffle(items);

  let startMinutes = 8 * 60 + 30;
  if (startTime && startTime.includes(':')) {
    const [h, m] = startTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      startMinutes = h * 60 + m;
    }
  }

  const orderedList = shuffled.map((name, index) => {
    const currentMin = startMinutes + index * intervalMinutes;
    const hours = Math.floor(currentMin / 60) % 24;
    const mins = currentMin % 60;
    const timeSlot = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    return {
      rank: index + 1,
      name,
      timeSlot,
    };
  });

  return { orderedList };
}

/**
 * Deterministically selects K candidates (lottery)
 */
export function allocateLottery(
  payload: LotteryPayload,
  prng: DeterministicPRNG
): LotteryAllocationResult {
  const candidates = cleanCandidatesList(payload.candidates);
  const { pickCount, allowDuplicates } = payload;
  const chosen = prng.sample(candidates, pickCount, allowDuplicates);

  return {
    selected: chosen.map((name, index) => ({
      rank: index + 1,
      name,
    })),
  };
}

/**
 * Memory-safe deterministic random number generator for ranges
 */
export function allocateRange(
  payload: RangePayload,
  prng: DeterministicPRNG
): RangeAllocationResult {
  const { min, max, count, unique } = payload;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const totalNumbers = high - low + 1;

  if (unique) {
    const targetCount = Math.min(Math.max(1, count), totalNumbers);

    // If range is reasonably small, use full shuffle
    if (totalNumbers <= 10000) {
      const allNums: number[] = new Array(totalNumbers);
      for (let i = 0; i < totalNumbers; i++) {
        allNums[i] = low + i;
      }
      return { numbers: prng.sample(allNums, targetCount, false) };
    }

    // Memory-safe sampling for large ranges (e.g. 1 to 1,000,000)
    const selected = new Set<number>();
    const result: number[] = [];

    while (selected.size < targetCount) {
      const num = prng.nextInt(low, high);
      if (!selected.has(num)) {
        selected.add(num);
        result.push(num);
      }
    }

    return { numbers: result };
  } else {
    const targetCount = Math.max(1, Math.min(count, 1000));
    const numbers: number[] = new Array(targetCount);
    for (let i = 0; i < targetCount; i++) {
      numbers[i] = prng.nextInt(low, high);
    }
    return { numbers };
  }
}
