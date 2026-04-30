export function buildReferralUrl(path: string, referralCode: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
  return `${appUrl}${path}?ref=${encodeURIComponent(referralCode)}`;
}
