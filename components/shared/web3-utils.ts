export function formatShortWalletAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
}
