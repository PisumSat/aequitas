/**
 * Deterministic Pseudo-Random Number Generator based on Mulberry32 + SplitMix32.
 * Seeded by a 256-bit cryptographic hex string (derived from NIST Beacon).
 * Guarantees identical outputs on any machine, platform, or browser for the same seed.
 */
export class DeterministicPRNG {
  private state: number;
  private initialSeedHex: string;

  constructor(seedHex: string) {
    this.initialSeedHex = seedHex;
    // Derive 32-bit integer state from the first 8 hex characters
    // and XOR with subsequent slices for complete avalanche
    let s = 0;
    const clean = seedHex.replace(/[^0-9a-fA-F]/g, '');
    for (let i = 0; i < clean.length; i += 8) {
      const chunk = clean.slice(i, i + 8);
      const val = parseInt(chunk, 16);
      if (!isNaN(val)) {
        s = (s ^ val) >>> 0;
      }
    }
    this.state = s === 0 ? 0x12345678 : s;
  }

  /**
   * Mulberry32 algorithm
   * Fast, statistically robust 32-bit generator with 2^32 period
   */
  public nextUint32(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Returns a float in [0, 1)
   */
  public nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /**
   * Returns an integer in range [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  /**
   * Unbiased Fisher-Yates shuffle
   * Mutates copy and returns shuffled array
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Select k items from array with or without replacement
   */
  public sample<T>(array: readonly T[], count: number, allowDuplicates = false): T[] {
    if (count <= 0 || array.length === 0) return [];
    
    if (allowDuplicates) {
      const res: T[] = [];
      for (let i = 0; i < count; i++) {
        const idx = this.nextInt(0, array.length - 1);
        res.push(array[idx]);
      }
      return res;
    }

    // Without duplicates: shuffle and take top count
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  public getSeed(): string {
    return this.initialSeedHex;
  }
}
