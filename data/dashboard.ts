export const registrations = [
  { id: "reg-001", name: "Anna K.", telegram: "@annak", event: "Noir Signal", status: "Confirmed", source: "RAVE-ANNA", checkedIn: false },
  { id: "reg-002", name: "Max D.", telegram: "@maxphase", event: "Noir Signal", status: "Payment pending", source: "Direct", checkedIn: false },
  { id: "reg-003", name: "Ira V.", telegram: "@irav", event: "Violet Current", status: "Confirmed", source: "RAVE-CREW", checkedIn: true },
  { id: "reg-004", name: "Roman S.", telegram: "@romans", event: "Blue Hour Protocol", status: "Invited", source: "RAVE-MAX", checkedIn: false }
];

export const referrals = [
  { code: "RAVE-ANNA", ownerName: "Anna K.", clicks: 142, registrations: 38, confirmed: 31 },
  { code: "RAVE-CREW", ownerName: "Crew Drop", clicks: 96, registrations: 24, confirmed: 19 },
  { code: "RAVE-MAX", ownerName: "Max D.", clicks: 61, registrations: 14, confirmed: 9 }
];

export const metrics = {
  revenue: "418,400 UAH",
  registrations: 569,
  conversionRate: "18.7%",
  referralRegistrations: 76,
  telegramConfirmations: 344,
  capacityUsed: "74%"
};

export const aiSuggestions = [
  {
    prompt: "How to increase registrations?",
    response:
      "Push a 6-hour referral sprint around Noir Signal. RAVE-ANNA has the strongest conversion, so lead with that source, make Telegram the primary CTA, and repeat the capacity signal before 19:00."
  },
  {
    prompt: "Write Telegram post",
    response:
      "Noir Signal is 74% filled. Final ticket wave is open now: premium production, limited capacity, confirmation in Telegram. Bring your referral link if you want your group on the list."
  },
  {
    prompt: "Best referral strategy?",
    response:
      "Prioritize RAVE-ANNA first, then give Crew Drop a short second wave. RAVE-ANNA has 142 clicks, 38 registrations, and 31 confirmed, so it should carry the next invite push."
  },
  {
    prompt: "Summarize event performance",
    response:
      "Rave'era has 569 total registrations across active events, 76 referral-led registrations, and 344 Telegram confirmations. Noir Signal is closest to sellout."
  }
];
