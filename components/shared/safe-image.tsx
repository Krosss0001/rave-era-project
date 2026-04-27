"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_EVENT_IMAGE, getSafeImageSrc, isFallbackImage } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src" | "onError" | "onLoad" | "unoptimized"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
  timeoutMs?: number;
};

export function SafeImage({
  src,
  fallbackSrc = FALLBACK_EVENT_IMAGE,
  timeoutMs = 8000,
  alt,
  ...props
}: SafeImageProps) {
  const safeFallback = useMemo(() => getSafeImageSrc(fallbackSrc), [fallbackSrc]);
  const normalizedSrc = useMemo(() => getSafeImageSrc(src, safeFallback), [src, safeFallback]);
  const [imageSrc, setImageSrc] = useState(normalizedSrc);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setImageSrc(normalizedSrc);
  }, [normalizedSrc]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isFallbackImage(imageSrc, safeFallback)) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setImageSrc(safeFallback);
    }, timeoutMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [imageSrc, safeFallback, timeoutMs]);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function useFallback() {
    clearTimer();
    setImageSrc(safeFallback);
  }

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      unoptimized
      onLoad={clearTimer}
      onError={useFallback}
    />
  );
}
