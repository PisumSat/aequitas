export type AllocationMode = 'shifts' | 'groups' | 'order' | 'lottery' | 'range';

export interface ShiftDefinition {
  id: string;
  name: string;
  code: string;
  color: string;
  category: 'night' | 'er' | 'ward' | 'icu' | 'general';
  weight: number; // for workload balancing, default 1
  slotsPerDay: number;
}

export interface ShiftDateSlot {
  dateIso: string; // "2026-10-01"
  dayOfWeek: string; // "Thu"
  isWeekend: boolean;
  shifts: {
    shiftId: string;
    slotIndex: number;
    assignedCandidate?: string;
  }[];
}

export interface ShiftsPayload {
  candidates: string[];
  startDate: string; // "2026-10-01"
  endDate: string; // "2026-10-14"
  shifts: ShiftDefinition[];
  maxShiftsPerPerson?: number;
  preventConsecutiveNights?: boolean;
  balanceWeekends?: boolean;
}

export interface GroupsPayload {
  candidates: string[];
  groupCount?: number;
  groupNames: string[];
  balanceSizes: boolean;
}

export interface OrderPayload {
  items: string[];
  startTime?: string; // "08:30"
  intervalMinutes?: number; // 15
}

export interface LotteryPayload {
  candidates: string[];
  pickCount: number;
  allowDuplicates: boolean;
}

export interface RangePayload {
  min: number;
  max: number;
  count: number;
  unique: boolean;
}

export type PayloadMap = {
  shifts: ShiftsPayload;
  groups: GroupsPayload;
  order: OrderPayload;
  lottery: LotteryPayload;
  range: RangePayload;
};

export interface RandomizerCommitment<T extends AllocationMode = AllocationMode> {
  v: 1;
  id: string;
  title: string;
  mode: T;
  targetPulseIso: string;
  targetTimestampMs: number;
  createdAtIso: string;
  creatorName?: string;
  paramsHash: string; // SHA-256 of canonical payload
  payload: PayloadMap[T];
}

export interface NistPulse {
  uri: string;
  version: string;
  pulseIndex: number;
  timeStamp: string;
  outputValue: string; // 512-bit hex
  signatureValue: string;
  certificateId: string;
  statusCode: number;
  external?: {
    sourceId: string;
    statusCode: number;
    value: string;
  };
}

export interface ShiftAllocationResult {
  schedule: ShiftDateSlot[];
  studentStats: {
    name: string;
    totalShifts: number;
    nightShifts: number;
    weekendShifts: number;
  }[];
}

export interface GroupAllocationResult {
  groups: {
    name: string;
    members: string[];
  }[];
}

export interface OrderAllocationResult {
  orderedList: {
    rank: number;
    name: string;
    timeSlot?: string;
  }[];
}

export interface LotteryAllocationResult {
  selected: {
    rank: number;
    name: string;
  }[];
}

export interface RangeAllocationResult {
  numbers: number[];
}

export interface ExecutionAudit {
  nistPulse: NistPulse;
  paramsHash: string;
  combinedSeedHex: string;
  derivedSeed32: number;
  verifiedAt: string;
}
