import { NextResponse } from "next/server";
import { resolveBroadcastAudience } from "@/lib/telegram/audiences";
import {
  assertBroadcastAccess,
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
    const actor = await requireBroadcastActor(request);

    const input = parseBroadcastRequest(await request.json());
    const event = await getBroadcastEvent(input.eventId);
    assertBroadcastAccess({
      userId: actor.userId,
      role: actor.role,
      audience: input.audience,
      event
    });

    const recipients = await resolveBroadcastAudience({
      audience: input.audience,
      eventId: input.eventId
    });

    return NextResponse.json({
      ok: true,
      audience: input.audience,
      audienceLabel: getBroadcastAudienceLabel(input.audience),
      estimatedRecipientCount: recipients.length,
      sampleRecipients: recipients.slice(0, 10)
    });
  } catch (error) {
    return errorResponse(error);
  }
}
