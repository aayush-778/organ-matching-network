// bloodMask/hlaMask values below are computed against bitmask_check.h's real
// layout (bits 0-3 ABO, bit 4 Rh, bits 5-20 HLA -- HLA_SHIFT = 5).

import { RecipientDoc } from "@/models/Recipient";
import { bloodTypeToMask, hlaArrayToMask } from "@/lib/bitmask";

export const SEED_RECIPIENTS: RecipientDoc[] = [
  {
    patientId: "PT_101",
    name: "A. Whitfield",
    organNeeded: "Heart",
    urgency: 9,
    waitingYears: 3.2,
    bloodType: "A+",
    bloodMask: bloodTypeToMask("A+"), // 18
    hlaAntigens: [0, 2, 5],
    hlaMask: hlaArrayToMask([0, 2, 5]), // 1184
    hospitalId: 45,
    hospitalName: "St. Vincent Regional",
    status: "waiting",
  },
  {
    patientId: "PT_102",
    name: "R. Nakamura",
    organNeeded: "Heart",
    urgency: 6,
    waitingYears: 5.8,
    bloodType: "O+",
    bloodMask: bloodTypeToMask("O+"), // 17
    hlaAntigens: [1, 3],
    hlaMask: hlaArrayToMask([1, 3]), // 320
    hospitalId: 99,
    hospitalName: "Lakeside Memorial",
    status: "waiting",
  },
  {
    patientId: "PT_103",
    name: "J. Okafor",
    organNeeded: "Heart",
    urgency: 8,
    waitingYears: 1.4,
    bloodType: "O-",
    bloodMask: bloodTypeToMask("O-"), // 1
    hlaAntigens: [0, 1, 2],
    hlaMask: hlaArrayToMask([0, 1, 2]), // 224
    hospitalId: 45,
    hospitalName: "St. Vincent Regional",
    status: "waiting",
  },
  {
    patientId: "PT_104",
    name: "M. Alvarez",
    organNeeded: "Heart",
    urgency: 10,
    waitingYears: 0.6,
    bloodType: "A+",
    bloodMask: bloodTypeToMask("A+"), // 18
    hlaAntigens: [2, 4, 6],
    hlaMask: hlaArrayToMask([2, 4, 6]), // 2688
    hospitalId: 77,
    hospitalName: "Northgate University Hospital",
    status: "waiting",
  },
];
