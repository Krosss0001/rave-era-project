import { Keypair, LAMPORTS_PER_SOL, PublicKey, type ParsedInstruction, type PartiallyDecodedInstruction } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import type { Address } from "@solana/kit";
import BigNumber from "bignumber.js";

export const SOLANA_PAY_NETWORK = "devnet" as const;
export const SOLANA_PAY_LABEL = "Rave'era Group";
export const DEFAULT_DEVNET_TICKET_PRICE_SOL = 0.001;
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export function generateSolanaPayReference() {
  return Keypair.generate().publicKey.toBase58();
}

export function getSolanaPayRecipient() {
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
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();

  if (!rpcUrl) {
    throw new Error("Solana Devnet RPC URL is not configured.");
  }

  return rpcUrl;
}

export function resolveDevnetAmountSol(eventPrice: number) {
  const configuredAmount = process.env.NEXT_PUBLIC_SOLANA_DEVNET_TICKET_PRICE_SOL?.trim();

  if (configuredAmount) {
    const parsed = Number(configuredAmount);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    throw new Error("Solana Devnet ticket price is invalid.");
  }

  return eventPrice > 0 ? DEFAULT_DEVNET_TICKET_PRICE_SOL : 0;
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
