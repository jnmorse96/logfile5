import { useEffect, useRef } from "react";

/*
  A field of intestinal villi (the finger-like folds that line the gut and
  absorb nutrients) rendered with three.js. The villi sway gently, and the
  camera travels forward along the lining as the page scrolls.

  Readability and performance rules:
  - three.js is loaded lazily, after the news has rendered.
  - Colors come from the page's CSS variables, so it follows light/dark mode
    and each section's accent, and fades into fog that matches the page.
  - Pauses when the tab is hidden; fewer villi and a lower pixel ratio on phones.
  - prefers-reduced-motion: draws one still frame and never animates.
  - If WebGL isn't available, nothing renders and the plain background shows.
*/

export default function VilliBackground({ channelId }) {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const start = () => {
      import("./villiScene.js").then(({ init }) => {
        if (disposed) return;
        cleanup = init(canvasRef.current, apiRef);
      }).catch(() => { /* no 3D, plain background remains */ });
    };
    // Let the news paint first.
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300);
    return () => {
      disposed = true;
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      clearTimeout(idle);
      cleanup();
    };
  }, []);

  // Re-tint when the section changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => apiRef.current?.recolor());
    return () => cancelAnimationFrame(id);
  }, [channelId]);

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />;
}
