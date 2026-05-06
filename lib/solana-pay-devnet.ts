import { Keypair, LAMPORTS_PER_SOL, PublicKey, type ParsedInstruction, type PartiallyDecodedInstruction } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import type { Address } from "@solana/kit";
import BigNumber from "bignumber.js";

export const SOLANA_PAY_NETWORK = "devnet" as const;
export const SOLANA_PAY_LABEL = "Rave'era Group";
export const DEFAULT_DEVNET_TICKET_PRICE_SOL = 0.001;
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

function assertDevnetNetwork() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.trim() || SOLANA_PAY_NETWORK;

  if (network !== SOLANA_PAY_NETWORK) {
    throw new Error("Only Solana Devnet payments are supported.");
  }
}

export function generateSolanaPayReference() {
  return Keypair.generate().publicKey.toBase58();
}

export function getSolanaPayRecipient() {
  assertDevnetNetwork();

  const recipient = process.env.NEXT_PUBLIC_SOLANA_PAY_RECIPIENT?.trim();

  if (!recipient) {
    throw new Error("Solana Pay recipient is not configured.");
  }

  try {
    return new PublicKey(recipient).toBase58();
  } catch {
    throw new Error("Solana Pay recipient is invalid.");
  }
}

export function getSolanaRpcUrl() {
  assertDevnetNetwork();

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();

  if (!rpcUrl) {
    throw new Error("Solana Devnet RPC URL is not configured.");
  }

  return rpcUrl;
}

export function getDevnetUahPerSolRate() {
  const configuredRate = process.env.NEXT_PUBLIC_SOLANA_DEVNET_UAH_PER_SOL?.trim();

  if (!configuredRate) {
    return null;
  }

  const rate = Number(configuredRate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Solana Devnet UAH/SOL rate is invalid.");
  }

  return rate;
}

export function resolveDevnetAmountSol(eventPriceUah: number) {
  const rateUahPerSol = getDevnetUahPerSolRate();

  if (!Number.isFinite(eventPriceUah) || eventPriceUah <= 0) {
    return { amountSol: 0, originalPriceUah: 0, rateUahPerSol, usedFallback: false };
  }

  if (rateUahPerSol !== null) {
    return {
      amountSol: new BigNumber(eventPriceUah).div(rateUahPerSol).decimalPlaces(9, BigNumber.ROUND_HALF_UP).toNumber(),
      originalPriceUah: eventPriceUah,
      rateUahPerSol,
      usedFallback: false
    };
  }

  const configuredAmount = process.env.NEXT_PUBLIC_SOLANA_DEVNET_TICKET_PRICE_SOL?.trim();

  if (configuredAmount) {
    const parsed = Number(configuredAmount);

    if (Number.isFinite(parsed) && parsed > 0) {
      return {
        amountSol: new BigNumber(parsed).decimalPlaces(9, BigNumber.ROUND_HALF_UP).toNumber(),
        originalPriceUah: eventPriceUah,
        rateUahPerSol: null,
        usedFallback: true
      };
    }

    throw new Error("Solana Devnet ticket price is invalid.");
  }

  return {
    amountSol: DEFAULT_DEVNET_TICKET_PRICE_SOL,
    originalPriceUah: eventPriceUah,
    rateUahPerSol: null,
    usedFallback: true
  };
}

export function buildSolanaPaymentUrl(input: {
  recipient: string;
  amountSol: number;
  reference: string;
  eventTitle: string;
  ticketCode: string;
}) {
  const url = encodeURL({
    recipient: input.recipient as Address,
    amount: input.amountSol,
    reference: input.reference as Address,
    label: SOLANA_PAY_LABEL,
    message: `Ticket for ${input.eventTitle}`,
    memo: `raveera:${input.ticketCode}`
  });
  url.searchParams.set("cluster", SOLANA_PAY_NETWORK);

  return url.toString();
}

export function solToLamports(amountSol: number) {
  return new BigNumber(amountSol).times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR);
}

export function isParsedInstruction(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): instruction is ParsedInstruction {
  return "parsed" in instruction;
}

export function getInstructionMemo(instruction: ParsedInstruction | PartiallyDecodedInstruction) {
  if (instruction.programId.toBase58() !== MEMO_PROGRAM_ID) {
    return null;
  }

  if (isParsedInstruction(instruction) && typeof instruction.parsed === "string") {
    return instruction.parsed;
  }

  if (!isParsedInstruction(instruction) && typeof instruction.data === "string") {
    return instruction.data;
  }

  return null;
}
