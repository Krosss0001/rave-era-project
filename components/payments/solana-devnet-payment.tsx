"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw, Wallet } from "lucide-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import QRCode from "qrcode";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatShortWalletAddress } from "@/components/shared/web3-utils";

type SolanaIntent = {
  intent_id: string;
  reference: string;
  payment_url: string;
  amount_sol: number;
  original_price_uah: number | null;
  rate_uah_per_sol: number | null;
  recipient: string;
  network: "devnet";
};

type SolanaDevnetPaymentProps = {
  ticketId: string;
  onConfirmed: (input: { ticketId: string; signature: string | null }) => void;
  title?: string;
};

type PhantomPaymentProvider = {
  isPhantom?: boolean;
  publicKey?: { toString: () => string } | null;
  isConnected?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Solana payment request failed.";
}

function formatAmount(value: number | null | undefined, maximumFractionDigits = 9) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

async function parseApiResponse(response: Response) {
  const data = await response.json();

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "Solana payment request failed.");
  }

  return data;
}

function getPhantomProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = window.solana as PhantomPaymentProvider | undefined;
  return provider?.isPhantom ? provider : null;
}

function getSolanaRpcUrl() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

  if (network !== "devnet") {
    throw new Error("Only Solana Devnet payments are supported.");
  }

  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
}

function solToLamports(amountSol: number) {
  const fixed = amountSol.toFixed(9);
  const [wholePart, decimalPart = ""] = fixed.split(".");
  const wholeLamports = BigInt(wholePart) * BigInt(LAMPORTS_PER_SOL);
  const decimalLamports = BigInt(decimalPart.padEnd(9, "0").slice(0, 9));

  return Number(wholeLamports + decimalLamports);
}

function getSignaturePreview(signature: string | null) {
  return signature ? `${signature.slice(0, 8)}...${signature.slice(-8)}` : null;
}

export function SolanaDevnetPayment({ ticketId, onConfirmed, title = "Pay with Solana Devnet" }: SolanaDevnetPaymentProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [intent, setIntent] = useState<SolanaIntent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "ready" | "sending" | "checking" | "confirmed" | "error">("idle");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

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
      return data;
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
      return null;
    }
  }

  async function verifyPayment(currentIntent: SolanaIntent) {
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
        body: JSON.stringify({ intent_id: currentIntent.intent_id })
      });
      const data = await parseApiResponse(response) as { confirmed: boolean; status?: string; signature?: string | null };

      if (!data.confirmed) {
        setStatus("ready");
        setMessage("Payment sent. Wait a few seconds and click Check payment.");
        return;
      }

      const verifiedSignature = data.signature ?? signature;
      setSignature(verifiedSignature ?? null);
      setStatus("confirmed");
      setMessage("Payment confirmed. Ticket QR is now active.");
      onConfirmed({ ticketId, signature: verifiedSignature ?? null });
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function payWithConnectedPhantom() {
    const currentIntent = intent ?? await createIntent();

    if (!currentIntent) {
      return;
    }

    const provider = getPhantomProvider();

    if (!provider) {
      setStatus("error");
      setMessage("Phantom extension is not installed. Install Phantom or scan the QR with Phantom mobile.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      if (currentIntent.network !== "devnet") {
        throw new Error("Only Solana Devnet payments are supported.");
      }

      const walletPublicKey = provider.publicKey ?? (await provider.connect()).publicKey;

      if (!walletPublicKey) {
        throw new Error("Connect Phantom before paying.");
      }

      const sender = new PublicKey(walletPublicKey.toString());
      const recipient = new PublicKey(currentIntent.recipient);
      const reference = new PublicKey(currentIntent.reference);
      const lamports = solToLamports(Number(currentIntent.amount_sol));

      if (!Number.isFinite(lamports) || lamports <= 0) {
        throw new Error("Invalid Devnet payment amount.");
      }

      const connection = new Connection(getSolanaRpcUrl(), "confirmed");
      const transaction = new Transaction();
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports
      });
      transferInstruction.keys.push({ pubkey: reference, isSigner: false, isWritable: false });
      transaction.add(transferInstruction);
      transaction.feePayer = sender;

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;

      let sentSignature = "";

      if (provider.signAndSendTransaction) {
        const result = await provider.signAndSendTransaction(transaction);
        sentSignature = result.signature;
      } else if (provider.signTransaction) {
        const signedTransaction = await provider.signTransaction(transaction);
        sentSignature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false
        });
      } else {
        throw new Error("Connected Phantom cannot sign transactions in this browser.");
      }

      setSignature(sentSignature);
      setMessage(`Payment sent: ${getSignaturePreview(sentSignature)}. Confirming on Devnet...`);

      await connection.confirmTransaction(
        {
          signature: sentSignature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        },
        "confirmed"
      );

      await verifyPayment(currentIntent);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function checkPayment() {
    const currentIntent = intent ?? await createIntent();

    if (!currentIntent) {
      return;
    }

    await verifyPayment(currentIntent);
  }

  async function copyPaymentUrl() {
    const currentIntent = intent ?? await createIntent();

    if (!currentIntent?.payment_url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentIntent.payment_url);
      setMessage("Solana Pay URL copied. On mobile, scan QR with Phantom.");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  const busy = status === "creating" || status === "sending" || status === "checking";
  const signaturePreview = getSignaturePreview(signature);

  return (
    <div className="mt-4 border border-primary/20 bg-primary/[0.025] p-3 sm:p-4">
      <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-white/58">
            <p>Devnet payment is for demo/testing only.</p>
            {intent ? (
              <>
                <p>Event price: {formatAmount(intent.original_price_uah, 2)} UAH</p>
                <p>Devnet conversion rate: {formatAmount(intent.rate_uah_per_sol, 2)} UAH / SOL</p>
                <p className="font-semibold text-white/78">Amount to pay: {formatAmount(intent.amount_sol)} SOL</p>
              </>
            ) : (
              <p>On desktop, use connected Phantom. On mobile, scan QR with Phantom.</p>
            )}
          </div>
          {intent ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/36" title={intent.recipient}>
              Recipient {formatShortWalletAddress(intent.recipient)}
            </p>
          ) : null}
          {signaturePreview ? (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              Signature {signaturePreview}
            </p>
          ) : null}
        </div>
        {status === "confirmed" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        ) : qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Solana Pay QR" className="h-28 w-28 shrink-0 self-center bg-white p-1 min-[420px]:h-24 min-[420px]:w-24" />
        ) : (
          <div className="flex h-28 w-28 shrink-0 self-center items-center justify-center border border-white/[0.06] bg-black min-[420px]:h-24 min-[420px]:w-24">
            <QrCode className="h-7 w-7 text-white/35" aria-hidden="true" />
          </div>
        )}
      </div>

      {intent?.payment_url ? (
        <p className="mt-3 max-h-24 overflow-y-auto break-all border border-white/[0.05] bg-black px-3 py-2 font-mono text-[10px] leading-5 text-white/38 [scrollbar-width:thin]">
          {intent.payment_url}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
        <button
          type="button"
          onClick={payWithConnectedPhantom}
          disabled={busy || status === "confirmed"}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-primary/40 bg-primary/[0.04] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition duration-200 hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "creating" || status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
          Pay with connected Phantom
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

      <button
        type="button"
        onClick={copyPaymentUrl}
        disabled={busy || status === "confirmed"}
        className="focus-ring mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-white/[0.08] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 transition duration-200 hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        Copy Solana Pay URL
      </button>

      {message ? (
        <p className={`mt-3 text-sm leading-6 ${status === "error" ? "text-red-100" : "text-white/56"}`} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
