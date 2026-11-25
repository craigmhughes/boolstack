import { CSSProperties } from 'react';
import { cx } from 'class-variance-authority';
import { ReactNode } from 'react';

type BlendMode = CSSProperties['mixBlendMode'];

interface GradientLayerConfig {
  blur: string;
  blurMd: string;
  opacity?: string;
  gradient: string;
  blendMode: BlendMode;
}

interface GradientBackgroundProps {
  children?: ReactNode;
  layers?: GradientLayerConfig[];
  className?: string;
  showGrain?: boolean;
  grainOpacity?: number;
}

const defaultLayers: GradientLayerConfig[] = [
  {
    blur: 'blur-[50px]',
    blurMd: 'md:blur-[72px]',
    gradient: 'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 60%, rgb(12,24,210) 78%, rgba(0,0,0,0) 85%)',
    blendMode: 'screen',
  },
  {
    blur: 'blur-[175px]',
    blurMd: 'md:blur-[252px]',
    opacity: 'opacity-90',
    gradient: 'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 55%, rgba(12,24,210,0.4) 80%, rgba(0,0,0,0) 100%)',
    blendMode: 'soft-light',
  },
  {
    blur: 'blur-[50px]',
    blurMd: 'md:blur-[72px]',
    opacity: 'opacity-80',
    gradient: 'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 83.5%, #c8a8a6 84.5%, rgba(0,0,0,0) 85.5%)',
    blendMode: 'lighten',
  },
];

const grainSvg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/></filter></defs><rect width="100%" height="100%" fill="transparent" filter="url(#grain)"/></svg>`;

export function GradientBackground({ children, layers = defaultLayers, className, showGrain = false, grainOpacity = 0.15 }: GradientBackgroundProps) {
  return (
    <div className={
      cx(
        "relative overflow-hidden min-h-screen",
        className
      )
    }>
      {layers.map((layer, i) => (
        <div
          key={i}
          className={`absolute inset-0 pointer-events-none ${layer.blur} ${layer.blurMd} ${layer.opacity || ''}`}
          style={{
            background: layer.gradient,
            mixBlendMode: layer.blendMode,
          }}
          aria-hidden="true"
        />
      ))}
      {showGrain && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(grainSvg)}')`,
            opacity: grainOpacity,
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-[1]" data-gradient-children>
        {children}
      </div>
    </div>
  );
}
