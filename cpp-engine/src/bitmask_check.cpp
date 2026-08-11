// File: cpp-engine/src/bitmask_check.cpp
#include "bitmask_check.h"
#include <bitset>

namespace organmatch {
    bool BitmaskChecker::isBloodCompatible(uint32_t donor_mask, uint32_t recipient_mask) {
        uint32_t donor_abo = donor_mask & 0xF;
        uint32_t recip_abo = recipient_mask & 0xF;

        // check if donor and recipient has positive or neg rhs
        bool donor_rh = (donor_mask & RH_POS) != 0;
        bool recip_rh = (recipient_mask & RH_POS) != 0;

        // blood grp with Rh+ are not compatible with Rh-
        if(donor_rh && !(recip_rh)) {
            return false;
        }

        // validate against unknown error
        if(donor_abo == 0 || recip_abo == 0) {
            return false;
        }

        // O is the universal donor (O- can give to anyone; O+ can give to all positive types)
        if(donor_abo == BLOOD_O) {
            return true;
        }

        // AB is the universal recipient (can receive from O, A, B, and AB matching their Rh profile).
        if(recip_abo == BLOOD_AB) {
            return true;
        }

        // exact blood type matches (e.g., A -> A, B -> B)
        if (donor_abo == recip_abo) {
            return true;
        }

        return false;
    }

    int BitmaskChecker::countHlaMismatches(uint32_t donor_mask, uint32_t recipient_mask) {
        // XOR isolates mismatched bits where a bit is set in one mask but not the other
        uint32_t diff = (donor_mask ^ recipient_mask) & HLA_MASK;

        // std::bitset::count() utilizes compilers' built-in intrinsic __builtin_popcount
        // which compiles directly down to CPU POPCNT hardware instructions
        return static_cast<int>(std::bitset<32>(diff).count());
    }

    compatibilityResult BitmaskChecker::check(uint32_t donor_mask,
                                            uint32_t recipient_mask,
                                            int max_allowed_mismatches) {
        compatibilityResult result{};
        result.blood_compatible = isBloodCompatible(donor_mask, recipient_mask);
        result.hla_mismatches   = countHlaMismatches(donor_mask, recipient_mask);
        result.overall_compatible = result.blood_compatible &&
                                    result.hla_mismatches <= max_allowed_mismatches;
        return result;
    }
}// namespace organmatch