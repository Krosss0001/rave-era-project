import { SafeImage } from "@/components/shared/safe-image";

type SafeEventImageProps = {
  src: string | null | undefined;
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
};

export function SafeEventImage({ src, alt, className, sizes, priority = false }: SafeEventImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}
