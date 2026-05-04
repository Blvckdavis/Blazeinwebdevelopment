import { useMemo } from 'react';
import type { CultivationPath } from '@types/cultivation';
import { PATH_CONFIG } from '@types/cultivation';

interface CultivatorsAvatarProps {
  stage: number;
  path: CultivationPath;
  hasInternalInjury?: boolean;
  className?: string;
}

export function CultivatorsAvatar({
  stage,
  path,
  hasInternalInjury = false,
  className = '',
}: CultivatorsAvatarProps) {
  // Determine aura color based on path
  const auraColor = useMemo(() => {
    switch (path) {
      case 'Magicka':
        return { primary: '#4A90E2', secondary: '#1E3A8A', glow: 'rgba(74, 144, 226, 0.6)' };
      case 'Corporia':
        return { primary: '#DC2626', secondary: '#D97706', glow: 'rgba(220, 38, 38, 0.6)' };
      default:
        return { primary: '#888888', secondary: '#444444', glow: 'rgba(136, 136, 136, 0.3)' };
    }
  }, [path]);

  // Aura intensity increases with stage
  const auraOpacity = useMemo(() => {
    return 0.35 + (stage / 10) * 0.5; // 0.35 at stage 1, 0.85 at stage 10
  }, [stage]);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        perspective: '1000px',
        width: '200px',
        height: '240px',
      }}
    >
      {/* Pulsing Aura Background */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(ellipse at center, ${auraColor.glow}, transparent)`,
          opacity: auraOpacity,
          filter: 'blur(20px)',
          animation: 'pulse-aura 3s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* SVG Silhouette */}
      <svg
        viewBox="0 0 100 120"
        className="absolute z-10"
        style={{
          width: '120px',
          height: '144px',
          filter: hasInternalInjury ? 'grayscale(0.8) brightness(0.7)' : 'none',
          transition: 'filter 0.3s ease-out',
        }}
      >
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill={auraColor.primary} opacity="0.9" />

        {/* Halo/Crown effect */}
        <circle
          cx="50"
          cy="20"
          r="16"
          fill="none"
          stroke={auraColor.primary}
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Body/Torso in Lotus Pose */}
        <ellipse cx="50" cy="50" rx="18" ry="22" fill={auraColor.primary} opacity="0.85" />

        {/* Left Arm (mudra position) */}
        <path
          d="M 35 40 Q 25 35 20 45"
          stroke={auraColor.primary}
          strokeWidth="3"
          fill="none"
          opacity="0.8"
          strokeLinecap="round"
        />

        {/* Right Arm (mudra position) */}
        <path
          d="M 65 40 Q 75 35 80 45"
          stroke={auraColor.primary}
          strokeWidth="3"
          fill="none"
          opacity="0.8"
          strokeLinecap="round"
        />

        {/* Left Leg (lotus) */}
        <ellipse cx="35" cy="75" rx="8" ry="12" fill={auraColor.secondary} opacity="0.7" />

        {/* Right Leg (lotus) */}
        <ellipse cx="65" cy="75" rx="8" ry="12" fill={auraColor.secondary} opacity="0.7" />

        {/* Internal Injury Cracks */}
        {hasInternalInjury && (
          <g opacity="0.6" stroke="#DC2626" strokeWidth="1" fill="none">
            <path d="M 50 20 L 45 40 L 55 50" />
            <path d="M 50 20 L 55 35 L 48 55" />
            <path d="M 40 50 L 30 65 L 38 75" />
            <path d="M 60 50 L 70 65 L 62 75" />
          </g>
        )}
      </svg>

      {/* Stage Indicator Overlay */}
      <div
        className="absolute top-2 right-2 z-20 rounded-full flex items-center justify-center"
        style={{
          width: '32px',
          height: '32px',
          background: `rgba(${path === 'Magicka' ? '74, 144, 226' : path === 'Corporia' ? '220, 38, 38' : '136, 136, 136'}, 0.3)`,
          border: `2px solid ${auraColor.primary}`,
          boxShadow: `0 0 12px ${auraColor.glow}`,
        }}
      >
        <span
          style={{
            color: auraColor.primary,
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: `0 0 4px ${auraColor.glow}`,
          }}
        >
          {stage}
        </span>
      </div>

      <style>{`
        @keyframes pulse-aura {
          0%, 100% { opacity: ${auraOpacity * 0.8}; }
          50% { opacity: ${auraOpacity}; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
