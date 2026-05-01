import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram/bot";
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

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const status = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400;

  return NextResponse.json({ ok: false, error: message }, { status });
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
    const recipients = await resolveBroadcastAudience({
      audience: input.audience,
      eventId: input.eventId
    });
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

        await supabase.from("telegram_broadcast_recipients").insert({
          broadcast_id: broadcast.id,
          telegram_user_id: recipient.telegram_user_id,
          chat_id: recipient.chat_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown send error."
        });
      }
    }

    const finalStatus = failed > 0 ? "failed" : "sent";
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
      total: recipients.length,
      sent,
      failed
    });
  } catch (error) {
    return errorResponse(error);
  }
}
