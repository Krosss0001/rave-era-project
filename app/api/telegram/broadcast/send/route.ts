import { NextResponse } from "next/server";
import { sendTelegramMessage, verifyTelegramBotToken } from "@/lib/telegram/bot";
import { resolveBroadcastAudience } from "@/lib/telegram/audiences";
import {
  assertBroadcastAccess,
  formatBroadcastMessage,
  getBroadcastAudienceLabel,
  getBroadcastEvent,
  parseBroadcastRequest,
  requireBroadcastActor
} from "@/lib/telegram/broadcasts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIRST_REASON_LIMIT = 5;

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const status = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400;

  return NextResponse.json({ ok: false, error: message }, { status });
}

function getSkippedChatId(recipient: { telegram_user_id: string; chat_id: string | null }) {
  return recipient.chat_id?.trim() || `missing:${recipient.telegram_user_id}`;
}

function appendReason(reasons: string[], reason: string) {
  if (reasons.length < FIRST_REASON_LIMIT && !reasons.includes(reason)) {
    reasons.push(reason);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, role, supabase } = await requireBroadcastActor(request);
    const input = parseBroadcastRequest(await request.json());
    const event = await getBroadcastEvent(input.eventId);
    assertBroadcastAccess({
      userId,
      role,
      audience: input.audience,
      event
    });
    await verifyTelegramBotToken();

    const audience = await resolveBroadcastAudience({
      audience: input.audience,
      eventId: input.eventId
    });
    const { recipients, skippedRecipients } = audience;
    const formattedMessage = formatBroadcastMessage({
      language: input.language,
      message: input.message,
      event
    });

    const { data: broadcast, error: broadcastError } = await supabase
      .from("telegram_broadcasts")
      .insert({
        created_by: userId,
        event_id: input.eventId,
        audience: input.audience,
        language: input.language,
        message: input.message,
        status: "sending"
      })
      .select("id")
      .single();

    if (broadcastError || !broadcast) {
      throw broadcastError || new Error("Broadcast could not be created.");
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const firstFailureReasons: string[] = [];

    for (const recipient of skippedRecipients) {
      const { error } = await supabase.from("telegram_broadcast_recipients").insert({
        broadcast_id: broadcast.id,
        telegram_user_id: recipient.telegram_user_id,
        chat_id: getSkippedChatId(recipient),
        status: "skipped",
        error: recipient.reason
      });

      if (error) {
        appendReason(firstFailureReasons, error.message);
      }

      appendReason(firstFailureReasons, recipient.reason);
      skipped += 1;
    }

    for (const recipient of recipients) {
      try {
        await sendTelegramMessage(recipient.chat_id, formattedMessage);

        const { error } = await supabase.from("telegram_broadcast_recipients").insert({
          broadcast_id: broadcast.id,
          telegram_user_id: recipient.telegram_user_id,
          chat_id: recipient.chat_id,
          status: "sent",
          sent_at: new Date().toISOString()
        });

        if (error) {
          throw error;
        }

        sent += 1;
      } catch (error) {
        failed += 1;
        const reason = error instanceof Error ? error.message : "Unknown send error.";
        appendReason(firstFailureReasons, reason);

        await supabase.from("telegram_broadcast_recipients").insert({
          broadcast_id: broadcast.id,
          telegram_user_id: recipient.telegram_user_id,
          chat_id: recipient.chat_id,
          status: "failed",
          error: reason
        });
      }
    }

    const finalStatus = failed > 0 || sent === 0 ? "failed" : "sent";
    const { error: updateError } = await supabase
      .from("telegram_broadcasts")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString()
      })
      .eq("id", broadcast.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      ok: true,
      broadcastId: broadcast.id,
      audience: input.audience,
      audienceLabel: getBroadcastAudienceLabel(input.audience),
      total: recipients.length + skipped,
      sent,
      failed,
      skipped,
      firstFailureReasons
    });
  } catch (error) {
    return errorResponse(error);
  }
}
