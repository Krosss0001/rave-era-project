import { NextResponse } from "next/server";
import {
  SOLANA_PAY_NETWORK,
  buildSolanaPaymentUrl,
  generateSolanaPayReference,
  getSolanaPayRecipient,
  resolveDevnetAmountSol
} from "@/lib/solana-pay-devnet";
import { requireApiUser, apiErrorResponse } from "@/lib/supabase/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateBody = {
  ticket_id?: unknown;
};

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireApiUser(request);
    const body = (await request.json()) as CreateBody;
    const ticketId = typeof body.ticket_id === "string" ? body.ticket_id.trim() : "";

    if (!ticketId) {
      throw new Error("Ticket id is required.");
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id,registration_id,event_id,user_id,ticket_code,status,payment_status")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) {
      throw ticketError;
    }

    if (!ticket || ticket.user_id !== user.id) {
      throw new Error("forbidden");
    }

    if (ticket.status !== "reserved" || ticket.payment_status !== "pending") {
      throw new Error("Ticket is not pending payment.");
    }

    if (!ticket.registration_id) {
      throw new Error("Ticket registration is missing.");
    }

    const [{ data: registration, error: registrationError }, { data: event, error: eventError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase
          .from("registrations")
          .select("id,event_id,user_id,status")
          .eq("id", ticket.registration_id)
          .maybeSingle(),
        supabase
          .from("events")
          .select("id,title,price")
          .eq("id", ticket.event_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id,wallet_address")
          .eq("id", user.id)
          .maybeSingle()
      ]);

    if (registrationError) {
      throw registrationError;
    }

    if (eventError) {
      throw eventError;
    }

    if (profileError) {
      throw profileError;
    }

    if (!registration || registration.user_id !== user.id || registration.event_id !== ticket.event_id) {
      throw new Error("forbidden");
    }

    if (!event || Number(event.price) <= 0) {
      throw new Error("Solana Pay is only available for paid events.");
    }

    const walletAddress = profile?.wallet_address?.trim();

    if (!walletAddress) {
      throw new Error("Connect and save a wallet before paying.");
    }

    const amountSol = resolveDevnetAmountSol(Number(event.price));

    if (amountSol <= 0) {
      throw new Error("Invalid Devnet payment amount.");
    }

    const recipient = getSolanaPayRecipient();
    const reference = generateSolanaPayReference();
    const paymentUrl = buildSolanaPaymentUrl({
      recipient,
      amountSol,
      reference,
      eventTitle: event.title,
      ticketCode: ticket.ticket_code
    });

    const { data: intent, error: intentError } = await supabase
      .from("solana_payment_intents")
      .insert({
        ticket_id: ticket.id,
        registration_id: registration.id,
        event_id: event.id,
        user_id: user.id,
        wallet_address: walletAddress,
        reference,
        recipient,
        amount_sol: amountSol,
        network: SOLANA_PAY_NETWORK,
        status: "pending"
      })
      .select("id,reference,recipient,amount_sol,network")
      .single();

    if (intentError) {
      throw intentError;
    }

    return NextResponse.json({
      ok: true,
      intent_id: intent.id,
      reference: intent.reference,
      payment_url: paymentUrl,
      amount_sol: intent.amount_sol,
      recipient: intent.recipient,
      network: intent.network
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
