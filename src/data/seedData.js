import { addDays, subHours } from "date-fns";

const now = new Date();

export const initialBounties = [
  {
    id: "b-1",
    title: "Bring Your Own Tumbler",
    description:
      "Show your reusable cup at the canteen to earn coins and reduce single-use waste across campus.",
    instructions:
      "Photo must show a reusable tumbler with visible drink and canteen context.",
    coinReward: 50,
    sdgTag: 12,
    sdgLabel: "SDG 12 - Responsible Consumption",
    theme: "canteen",
    mediaType: "photo",
    aiVerificationHint:
      "Reject if no canteen context. Require tumbler, liquid, and tables/food stall hints.",
    isActive: true,
    createdAt: subHours(now, 40).toISOString(),
    expiresAt: addDays(now, 2).toISOString(),
    claimCount: 1,
  },
  {
    id: "b-2",
    title: "Lights Off in Empty Classroom",
    description: "Reduce wasted energy by reporting an empty classroom with lights off.",
    instructions:
      "Show classroom context and visible light switch in OFF state with no people.",
    coinReward: 40,
    sdgTag: 13,
    sdgLabel: "SDG 13 - Climate Action",
    theme: "energy",
    mediaType: "photo",
    aiVerificationHint:
      "Reject dark door photos. Must show classroom interior and OFF switch.",
    isActive: true,
    createdAt: subHours(now, 30).toISOString(),
    expiresAt: addDays(now, 1).toISOString(),
    claimCount: 0,
  },
  {
    id: "b-3",
    title: "Segregate Plastic Correctly",
    description: "Place plastic item inside the correct campus bin opening.",
    instructions:
      "Photo must show plastic item partially inside bin opening with correct label/color.",
    coinReward: 30,
    sdgTag: 11,
    sdgLabel: "SDG 11 - Sustainable Cities",
    theme: "waste",
    mediaType: "photo",
    aiVerificationHint:
      "Reject if item only near the bin. Require item entering bin opening.",
    isActive: true,
    createdAt: subHours(now, 20).toISOString(),
    expiresAt: addDays(now, 3).toISOString(),
    claimCount: 0,
  },
  {
    id: "b-4",
    title: "Zero Plastic Lunch",
    description: "Capture your meal tray with no single-use plastic wrappers.",
    instructions:
      "Frame full tray; no plastic packaging or disposable utensils visible.",
    coinReward: 60,
    sdgTag: 12,
    sdgLabel: "SDG 12 - Responsible Consumption",
    theme: "canteen",
    mediaType: "photo",
    aiVerificationHint:
      "Reject partial trays or any visible plastic wrappers and disposable utensils.",
    isActive: true,
    createdAt: subHours(now, 10).toISOString(),
    expiresAt: addDays(now, 4).toISOString(),
    claimCount: 2,
  },
  {
    id: "b-5",
    title: "Unplug a Left-Behind Charger",
    description: "Capture the exact moment of unplugging a charger from socket.",
    instructions:
      "Show hand interaction + charger + socket in one frame to prove action.",
    coinReward: 35,
    sdgTag: 13,
    sdgLabel: "SDG 13 - Climate Action",
    theme: "energy",
    mediaType: "photo",
    aiVerificationHint:
      "Reject if no hand interaction or only charger on floor with no socket context.",
    isActive: true,
    createdAt: subHours(now, 5).toISOString(),
    expiresAt: addDays(now, 2).toISOString(),
    claimCount: 2,
  },
];

export const demoTransactions = [
  {
    id: "t-1",
    type: "earned",
    amount: 25,
    description: "Tumbler Bounty",
    timestamp: subHours(now, 14).toISOString(),
  },
  {
    id: "t-2",
    type: "redeemed",
    amount: 50,
    description: "Canteen Discount",
    timestamp: subHours(now, 26).toISOString(),
  },
  {
    id: "t-3",
    type: "earned",
    amount: 15,
    description: "Waste Sorting",
    timestamp: subHours(now, 44).toISOString(),
  },
];

/** Sorted by totalEarned desc: matches Home “Top Contributors” podium (Marco, Sofia, Kei). */
export const leaderboardSeed = [
  { id: "s1", displayName: "Marco R.", totalEarned: 5210, approvedCount: 36 },
  { id: "s2", displayName: "Sofia L.", totalEarned: 4820, approvedCount: 31 },
  { id: "s3", displayName: "Kei T.", totalEarned: 4550, approvedCount: 30 },
  { id: "s4", displayName: "Sarah Jenkins", totalEarned: 4120, approvedCount: 21 },
  { id: "s5", displayName: "Jordan Wu", totalEarned: 3890, approvedCount: 19 },
  { id: "s6", displayName: "Alex Mercer", totalEarned: 2450, approvedCount: 14 },
];
