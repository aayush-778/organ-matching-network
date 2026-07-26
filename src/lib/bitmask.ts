// ============================================================================
// Mirrors cpp-engine/include/bitmask_check.h EXACTLY.
//
// BIT LAYOUT (bits 0-31, low to high):
//   bits 0-3   : ABO blood type   (one-hot: O=1, A=2, B=4, AB=8)
//   bit  4     : Rh factor        (1 = positive, 0 = negative)
//   bits 5-20  : HLA antigen presence flags (16 tracked loci, index 0-15)
//   bits 21-31 : reserved
//
// IMPORTANT: this is ONE combined mask per person, not separate blood/HLA
// masks. main.cpp's BitmaskChecker::check(donor_mask, recipient_mask, ...)
// takes exactly one mask per person and does blood-compat + HLA-XOR-popcount
// against different bit ranges of the SAME integer. Sending blood and HLA as
// two separate numbers (an earlier version of this pipeline did) means the
// HLA half never reaches the check at all -- combine them with bitwise OR
// before sending anything to the engine.
// ============================================================================

const ABO_BITS: Record<string, number> = {
  O: 1 << 0,
  A: 1 << 1,
  B: 1 << 2,
  AB: 1 << 3,
};

const RH_POS = 1 << 4;
const HLA_SHIFT = 5;
const HLA_BIT_COUNT = 16;

/*
  "A+", "O-", "AB+", etc. -> packed ABO+Rh bits (bits 0-4 only).
  Does NOT include HLA bits -- combine with hlaArrayToMask() via bitwise OR
  to get the full mask the engine expects.
*/
export function bloodTypeToMask(bloodType: string): number {
  const trimmed = bloodType.trim().toUpperCase();
  const rhPositive = trimmed.endsWith("+");
  const abo = trimmed.replace(/[+-]$/, "");

  const aboBits = ABO_BITS[abo];
  if (aboBits === undefined) {
    throw new Error(`Unrecognized ABO blood type: "${bloodType}"`);
  }

  return aboBits | (rhPositive ? RH_POS : 0);
}

/**
 * Antigen loci indices (0-15) -> packed HLA presence bits (bits 5-20 only).
 * Does NOT include ABO/Rh bits -- combine with bloodTypeToMask() via
 * bitwise OR to get the full mask the engine expects.
 */
export function hlaArrayToMask(hlaAntigens: number[]): number {
  let mask = 0;
  for (const locus of hlaAntigens) {
    if (locus < 0 || locus >= HLA_BIT_COUNT) {
      throw new Error(`HLA antigen index ${locus} out of range 0-${HLA_BIT_COUNT - 1}`);
    }
    mask |= 1 << (HLA_SHIFT + locus);
  }
  return mask;
}

/*
  The single value that actually goes over the wire to the C++ engine as
  "blood_mask" (or "donor_blood_mask" for the donor) -- ABO + Rh + HLA
  combined into one integer, matching bitmask_check.h's documented layout.
*/
export function combinePersonMask(bloodType: string, hlaAntigens: number[] = []): number {
  return bloodTypeToMask(bloodType) | hlaArrayToMask(hlaAntigens);
}

/* Inverse helpers, mostly useful for debugging/display. */
export function maskToBloodType(mask: number): string {
  const abo =
    Object.entries(ABO_BITS).find(([, bit]) => (mask & 0b1111) === bit)?.[0] ?? "?";
  const rh = mask & RH_POS ? "+" : "-";
  return `${abo}${rh}`;
}

export function maskToHlaArray(mask: number): number[] {
  const result: number[] = [];
  for (let locus = 0; locus < HLA_BIT_COUNT; locus++) {
    if (mask & (1 << (HLA_SHIFT + locus))) result.push(locus);
  }
  return result;
}
