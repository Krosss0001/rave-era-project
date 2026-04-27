export function buildReferralUrl(path: string, referralCode: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}${path}?ref=${encodeURIComponent(referralCode)}`;
}
