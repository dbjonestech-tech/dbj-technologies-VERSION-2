import Image from "next/image";

/* Full moon-and-wordmark Pathlight logo. Uses the optimized
   webp variants in /public/brand/pathlight/. The image is intrinsically
   square; pass `size` to set both width and height in CSS pixels. */

type PathlightLogoProps = {
  size?: number;
  priority?: boolean;
  className?: string;
  alt?: string;
};

export function PathlightLogo({
  size = 480,
  priority = false,
  className,
  alt = "Pathlight",
}: PathlightLogoProps) {
  return (
    <Image
      src="/brand/pathlight/logo-720.webp"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={className}
    />
  );
}
