/* Pathlight wordmark only — no moon. PATH inherits currentColor so it
   adapts to the parent's text color (white on dark surfaces, dark on
   light surfaces). LIGHT is locked to the brand cyan #5BA9D5 since the
   color reads on both light and dark backgrounds.

   The two color regions are rendered as CSS mask-image overlays so the
   underlying glyph shapes stay vector-quality on retina while accepting
   any background-color. The mask PNGs live at /public/brand/pathlight/
   and were generated from the official logo PNG. */

const PATH_MASK_W = 1194;
const PATH_MASK_H = 225;
const LIGHT_MASK_W = 1388;
const LIGHT_MASK_H = 228;
// Native horizontal gap between PATH and LIGHT in the source logo.
const NATIVE_GAP = 220;

type PathlightWordmarkProps = {
  height?: number;
  className?: string;
  lightColor?: string;
  ariaLabel?: string;
};

const maskBase = (url: string) => ({
  WebkitMaskImage: `url(${url})`,
  maskImage: `url(${url})`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskPosition: "left bottom",
  maskPosition: "left bottom",
});

export function PathlightWordmark({
  height = 28,
  className,
  lightColor = "#5BA9D5",
  ariaLabel = "Pathlight",
}: PathlightWordmarkProps) {
  const pathScale = height / PATH_MASK_H;
  const pathW = PATH_MASK_W * pathScale;
  const lightScale = height / LIGHT_MASK_H;
  const lightW = LIGHT_MASK_W * lightScale;
  const gap = NATIVE_GAP * pathScale;

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        height: `${height}px`,
        gap: `${gap}px`,
        verticalAlign: "middle",
        lineHeight: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: `${pathW}px`,
          height: `${height}px`,
          backgroundColor: "currentColor",
          ...maskBase("/brand/pathlight/wordmark-path-mask.png"),
        }}
      />
      <span
        aria-hidden="true"
        style={{
          width: `${lightW}px`,
          height: `${height}px`,
          backgroundColor: lightColor,
          ...maskBase("/brand/pathlight/wordmark-light-mask.png"),
        }}
      />
    </span>
  );
}
