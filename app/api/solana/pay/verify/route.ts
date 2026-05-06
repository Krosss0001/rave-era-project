import { Connection, PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { NextResponse } from "next/server";
import BigNumber from "bignumber.js";
import { incrementReferralCounters } from "@/lib/referral-tracking";
import { getInstructionMemo, getSolanaRpcUrl, isParsedInstruction, solToLamports } from "@/lib/solana-pay-devnet";
import { requireApiUser, apiErrorResponse } from "@/lib/supabase/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VerifyBody = {
  intent_id?: unknown;
};

function getTransferredLamports(transaction: ParsedTransactionWithMeta, recipient: string) {
  return transaction.transaction.message.instructions.reduce((total, instruction) => {
    if (!isParsedInstruction(instruction) || instruction.program !== "system") {
      return total;
    }

    const parsed = instruction.parsed;

    if (typeof parsed !== "object" || parsed === null || !("type" in parsed) || parsed.type !== "transfer") {
      return total;
    }

    const info = "info" in parsed && typeof parsed.info === "object" && parsed.info !== null ? parsed.info : null;
    const destination = info && "destination" in info && typeof info.destination === "string" ? info.destination : "";
    const lamports = info && "lamports" in info && typeof info.lamports === "number" ? info.lamports : 0;

    return destination === recipient ? total + lamports : total;
  }, 0);
}

function transactionHasReference(transaction: ParsedTransactionWithMeta, reference: string) {
  return transaction.transaction.message.accountKeys.some((account) => account.pubkey.toBase58() === reference);
}

function transactionMemoMatchesIfPresent(transaction: ParsedTransactionWithMeta, expectedMemo: string) {
  const memos = transaction.transaction.message.instructions
    .map((instruction) => getInstructionMemo(instruction))
    .filter((memo): memo is string => Boolean(memo));

  return memos.length === 0 || memos.includes(expectedMemo);
}

async function findValidPayment(input: {
  connection: Connection;
  reference: string;
  recipient: string;
  amountSol: number;
  memo: string;
}) {
  const referencePublicKey = new PublicKey(input.reference);
  const signatures = await input.connection.getSignaturesForAddress(referencePublicKey, { limit: 10 }, "confirmed");
  const expectedLamports = solToLamports(input.amountSol);
  const minimumLamports = BigNumber.maximum(expectedLamports.minus(1), 0);

  for (const item of signatures) {
    if (item.err) {
      continue;
    }

    const transaction = await input.connection.getParsedTransaction(item.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });

    if (!transaction || transaction.meta?.err) {
      continue;
    }

    if (!transactionHasReference(transaction, input.reference)) {
      continue;
    }

    const transferredLamports = new BigNumber(getTransferredLamports(transaction, input.recipient));

    if (transferredLamports.lt(minimumLamports)) {
      continue;
    }

    if (!transactionMemoMatchesIfPresent(transaction, input.memo)) {
      continue;
    }

    return item.signature;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireApiUser(request);
    const body = (await request.json()) as VerifyBody;
    const intentId = typeof body.intent_id === "string" ? body.intent_id.trim() : "";

    if (!intentId) {
      throw new Error("Intent id is required.");
    }

    const { data: intent, error: intentError } = await supabase
      .from("solana_payment_intents")
      .select("id,ticket_id,registration_id,event_id,user_id,reference,recipient,amount_sol,network,status,signature")
      .eq("id", intentId)
      .maybeSingle();

    if (intentError) {
      throw intentError;
    }

    if (!intent || intent.user_id !== user.id) {
      throw new Error("forbidden");
    }

    if (intent.network !== "devnet") {
      throw new Error("Only Devnet payments are supported.");
    }

    if (intent.status === "confirmed") {
      return NextResponse.json({ ok: true, confirmed: true, signature: intent.signature });
    }

    if (intent.status !== "pending") {
      throw new Error("Payment intent is not pending.");
    }

    if (!intent.ticket_id || !intent.registration_id || !intent.event_id) {
      throw new Error("Payment intent is incomplete.");
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id,registration_id,event_id,user_id,ticket_code,status,payment_status")
      .eq("id", intent.ticket_id)
      .maybeSingle();

    if (ticketError) {
      throw ticketError;
    }

    if (!ticket || ticket.user_id !== user.id || ticket.status !== "reserved" || ticket.payment_status !== "pending") {
      throw new Error("Ticket is not pending payment.");
    }

    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const signature = await findValidPayment({
      connection,
      reference: intent.reference,
      recipient: intent.recipient,
      amountSol: Number(intent.amount_sol),
      memo: `raveera:${ticket.ticket_code}`
    });

    if (!signature) {
      return NextResponse.json({ ok: true, confirmed: false, status: "pending" });
    }

    const { data: registrationBeforeUpdate } = await supabase
      .from("registrations")
      .select("id,event_id,referral_code,status")
      .eq("id", intent.registration_id)
      .maybeSingle();

    const [{ error: intentUpdateError }, { error: ticketUpdateError }, { error: registrationUpdateError }] = await Promise.all([
      supabase
        .from("solana_payment_intents")
        .update({
          status: "confirmed",
          signature,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", intent.id),
      supabase
        .from("tickets")
        .update({
          payment_status: "paid",
          status: "active"
        })
        .eq("id", ticket.id),
      supabase
        .from("registrations")
        .update({ status: "confirmed" })
        .eq("id", intent.registration_id)
    ]);

    if (intentUpdateError) {
      throw intentUpdateError;
    }

    if (ticketUpdateError) {
      throw ticketUpdateError;
    }

    if (registrationUpdateError) {
      throw registrationUpdateError;
    }

    await incrementReferralCounters(
      supabase,
      intent.event_id,
      registrationBeforeUpdate?.referral_code ?? null,
      { paid: 1, confirmed: registrationBeforeUpdate?.status === "confirmed" ? 0 : 1 },
      "solana_devnet_payment"
    );

    return NextResponse.json({ ok: true, confirmed: true, signature });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
