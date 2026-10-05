import { NistPulse } from '../types';

const NIST_BEACON_BASE = 'https://beacon.nist.gov/beacon/2.0';
const DRAND_FALLBACK_BASE = 'https://api.drand.sh/public';

export interface PulseFetchResult {
  success: boolean;
  pulse?: NistPulse;
  isFuture?: boolean;
  error?: string;
  source: 'nist' | 'drand-fallback' | 'simulated';
}

/**
 * Normalizes timestamp to NIST Beacon pulse boundary (every 60,000ms on the minute mark)
 */
export function snapToNistMinute(timestampMs: number): number {
  return Math.floor(timestampMs / 60000) * 60000;
}

/**
 * Formats a Date into ISO string aligned with NIST Beacon pulses (ending in :00.000Z)
 */
export function formatNistTimestamp(date: Date): string {
  const snapped = snapToNistMinute(date.getTime());
  return new Date(snapped).toISOString();
}

/**
 * Formats date display in both Local and UTC time
 */
export function formatDualTime(date: Date): string {
  const localStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const utcStr = date.toUTCString().slice(17, 25);
  return `${localStr} Local (${utcStr} UTC)`;
}

/**
 * Fetches the NIST Beacon 2.0 pulse for a specific UNIX timestamp in milliseconds.
 */
export async function fetchNistPulseByTime(targetTimestampMs: number): Promise<PulseFetchResult> {
  const snappedMs = snapToNistMinute(targetTimestampMs);
  const now = Date.now();

  // If the target is in the future compared to client clock, flag as future
  if (snappedMs > now) {
    const targetDate = new Date(snappedMs);
    return {
      success: false,
      isFuture: true,
      error: `Pulse will be published at ${formatDualTime(targetDate)}. Waiting for NIST emission...`,
      source: 'nist',
    };
  }

  const url = `${NIST_BEACON_BASE}/pulse/time/${snappedMs}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 404) {
      // Pulse not yet available on web cache (typically appears 5-15s after the minute mark)
      return {
        success: false,
        isFuture: true,
        error: 'Pulse emitted by NIST. Synchronizing with public verification servers...',
        source: 'nist',
      };
    }

    if (!res.ok) {
      throw new Error(`NIST Beacon returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.pulse && data.pulse.outputValue) {
      return {
        success: true,
        pulse: data.pulse as NistPulse,
        source: 'nist',
      };
    }

    throw new Error('Malformed NIST Beacon pulse response');
  } catch (err: any) {
    console.warn(`Direct NIST fetch note: ${err.message}`);
    
    // Check if offline or CORS issue, attempt Drand fallback if appropriate
    try {
      const drandRes = await fetch(`${DRAND_FALLBACK_BASE}/latest`);
      if (drandRes.ok) {
        const drandData = await drandRes.json();
        const fallbackPulse: NistPulse = {
          uri: `https://drand.love/round/${drandData.round}`,
          version: '2.0-drand-bridge',
          pulseIndex: drandData.round,
          timeStamp: new Date(snappedMs).toISOString(),
          outputValue: drandData.randomness + (drandData.signature ? drandData.signature.slice(0, 64) : ''),
          signatureValue: drandData.signature || 'drand-league-of-entropy',
          certificateId: 'league-of-entropy-drand-mainnet',
          statusCode: 0,
        };
        return {
          success: true,
          pulse: fallbackPulse,
          source: 'drand-fallback',
        };
      }
    } catch {
      // Both unavailable
    }

    return {
      success: false,
      error: err.message || 'Unable to connect to NIST Beacon. Please check your network or retry.',
      source: 'nist',
    };
  }
}

/**
 * Fetches the latest published NIST Beacon pulse to verify connectivity
 */
export async function fetchLatestNistPulse(): Promise<NistPulse | null> {
  try {
    const res = await fetch(`${NIST_BEACON_BASE}/pulse/last`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.pulse as NistPulse) || null;
  } catch (e) {
    console.warn('Unable to fetch latest pulse', e);
    return null;
  }
}
