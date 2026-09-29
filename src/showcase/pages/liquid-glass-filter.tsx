/** Le filtre SVG de distorsion que la page du verre liquide applique à ses modales. */
export function LiquidGlassFilter() {
  return (
    <svg className="tc-doc-liquid-filter" aria-hidden="true">
      <filter id="tc-doc-liquid-modal-dist" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.025 0.018"
          numOctaves="2"
          seed="18"
          result="liquidNoise"
        />
        <feGaussianBlur in="liquidNoise" stdDeviation="0.7" result="softNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softNoise"
          scale="12"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
