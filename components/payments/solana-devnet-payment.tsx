"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, QrCode, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatShortWalletAddress } from "@/components/shared/web3-utils";

type SolanaIntent = {
  intent_id: string;
  reference: string;
  payment_url: string;
  amount_sol: number;
  recipient: string;
  network: "devnet";
};

type SolanaDevnetPaymentProps = {
  ticketId: string;
  onConfirmed: (input: { ticketId: string; signature: string | null }) => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Solana payment request failed.";
}

async function parseApiResponse(response: Response) {
  const data = await response.json();

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "Solana payment request failed.");
  }

  return data;
}

export function SolanaDevnetPayment({ ticketId, onConfirmed }: SolanaDevnetPaymentProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [intent, setIntent] = useState<SolanaIntent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "ready" | "checking" | "confirmed" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!intent?.payment_url) {
      setQrDataUrl(null);
      return;
    }

    QRCode.toDataURL(intent.payment_url, { margin: 1, width: 168, color: { dark: "#000000", light: "#ffffff" } })
      .then((dataUrl) => {
        if (mounted) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (mounted) {
          setQrDataUrl(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [intent?.payment_url]);

  async function getAccessToken() {
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    const token = data.session?.access_token;

    if (!token) {
      throw new Error("Sign in again before paying.");
    }

    return token;
  }

  async function createIntent() {
    setStatus("creating");
    setMessage("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/solana/pay/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticket_id: ticketId })
      });
      const data = await parseApiResponse(response) as SolanaIntent & { ok: true };
      setIntent(data);
      setStatus("ready");
      window.open(data.payment_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  function openPaymentUrl() {
    if (!intent?.payment_url) {
      void createIntent();
      return;
    }

    window.open(intent.payment_url, "_blank", "noopener,noreferrer");
  }

  async function checkPayment() {
    if (!intent) {
      await createIntent();
      return;
    }

    setStatus("checking");
    setMessage("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/solana/pay/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ intent_id: intent.intent_id })
      });
      const data = await parseApiResponse(response) as { confirmed: boolean; status?: string; signature?: string | null };

      if (!data.confirmed) {
        setStatus("ready");
        setMessage("Payment not found yet on Devnet. Try again after Phantom confirms the transaction.");
        return;
      }

      setStatus("confirmed");
      setMessage("Payment confirmed. Ticket QR is now active.");
      onConfirmed({ ticketId, signature: data.signature ?? null });
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  const busy = status === "creating" || status === "checking";

  return (
    <div className="mt-4 border border-primary/20 bg-primary/[0.025] p-3">
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Pay with Solana Devnet</p>
          <p className="mt-2 text-sm leading-6 text-white/58">
            {intent ? `${intent.amount_sol} SOL Devnet` : "Devnet test payment creates an activation intent."}
          </p>
          {intent ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/36" title={intent.recipient}>
              Recipient {formatShortWalletAddress(intent.recipient)}
            </p>
          ) : null}
        </div>
        {status === "confirmed" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        ) : qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Solana Pay QR" className="h-24 w-24 shrink-0 bg-white p-1" />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-white/[0.06] bg-black">
            <QrCode className="h-7 w-7 text-white/35" aria-hidden="true" />
          </div>
        )}
      </div>

      {intent?.payment_url ? (
        <p className="mt-3 max-h-16 overflow-hidden break-all border border-white/[0.05] bg-black px-3 py-2 font-mono text-[10px] leading-5 text-white/38">
          {intent.payment_url}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
        <button
          type="button"
          onClick={openPaymentUrl}
          disabled={busy || status === "confirmed"}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-primary/40 bg-primary/[0.04] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition duration-200 hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "creating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
          Open Phantom / Pay
        </button>
        <button
          type="button"
          onClick={checkPayment}
          disabled={busy || status === "confirmed"}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-white/[0.08] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/62 transition duration-200 hover:border-primary/35 hover:bg-primary/[0.035] hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "checking" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          Check payment
        </button>
      </div>

      {message ? (
        <p className={`mt-3 text-sm leading-6 ${status === "error" ? "text-red-100" : "text-white/56"}`} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
