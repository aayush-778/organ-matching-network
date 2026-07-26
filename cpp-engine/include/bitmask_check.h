#pragma once
#include <cstdint>

// ============================================================================
// TIER 1: BIOCHEMICAL COMPATIBILITY MATRIX
//
// Encodes blood type + HLA antigen presence/absence into a single 32-bit
// integer per person, so compatibility between a donor and a recipient
// becomes a handful of bitwise ops instead of string comparisons or a
// database join. This is the classic "bitmask as compact set" trick.
//
// BIT LAYOUT (bits 0-31, low to high):
//   bits 0-3   : ABO blood type   (one-hot: O=1, A=2, B=4, AB=8)
//   bit  4     : Rh factor        (1 = positive, 0 = negative)
//   bits 5-20  : HLA antigen presence flags (16 tracked antigen loci)
//   bits 21-31 : reserved for future use (organ-specific antigens, etc.)
//
// Compatibility rules modeled:
//   1. Rh factor safety: An Rh-positive donor cannot give to an Rh-negative recipient.
//   2. ABO compatibility follows the standard rules:
//      - O is the universal donor.
//      - AB is the universal recipient.
//      - A can donate to A and AB.
//      - B can donate to B and AB.
// ============================================================================

namespace organmatch {
    enum BloodType : uint32_t {
        BLOOD_O = 1<<0, // 0001
        BLOOD_A = 1<<1, // 0010
        BLOOD_B = 1<<2, // 0100
        BLOOD_AB = 1<<3, // 1000
    };

    constexpr uint32_t RH_POS = 1u << 4;
    constexpr uint32_t HLA_SHIFT = 5;
    constexpr uint32_t HLA_BIT_COUNT = 16;
    constexpr uint32_t HLA_MASK = ((1u << HLA_BIT_COUNT) - 1) << HLA_SHIFT; // good technique

    struct compatibilityResult {
        bool blood_compatible;
        int  hla_mismatches;
        bool overall_compatible;
    };

    class BitmaskChecker {
    public:
        // Validates ABO and Rh compatibility bitwise masks.
        static bool isBloodCompatible(uint32_t donor_mask, uint32_t recipient_mask);

        // Counts mismatched HLA antigen bits between donor and recipient via XOR + popcount.
        static int countHlaMismatches(uint32_t donor_mask, uint32_t recipient_mask);

        // Complete check: blood type must be compatible AND HLA mismatches <= max_allowed_mismatches.
        static compatibilityResult check(uint32_t donor_mask,
                                        uint32_t recipient_mask,
                                        int max_allowed_mismatches = 4);
    };
}// namespace organmatch