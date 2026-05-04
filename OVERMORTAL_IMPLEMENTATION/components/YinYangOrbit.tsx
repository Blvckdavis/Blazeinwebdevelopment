import { useMemo } from 'react';
import type { CultivationPath } from '@types/cultivation';

interface YinYangOrbitProps {
  stage: number;
  path: CultivationPath;
  className?: string;
}

export function YinYangOrbit({ stage, path, className = '' }: YinYangOrbitProps) {
  // Determine orbital speed based on stage (faster at higher stages)
  const orbitDuration = useMemo(() => {
    return 40 - (stage - 1) * 1.2; // 40s at stage 1, 28.2s at stage 10
  }, [stage]);

  // Path affects orbital direction
  const orbitDirection = useMemo(() => {
    return path === 'Magicka' ? 'reverse' : 'normal';
  }, [path]);

  // Ball color based on path
  const ballColor = useMemo(() => {
    switch (path) {
      case 'Magicka':
        return { active: '#4A90E2', inactive: 'rgba(30, 58, 138, 0.4)' };
      case 'Corporia':
        return { active: '#DC2626', inactive: 'rgba(139, 0, 0, 0.4)' };
      default:
        return { active: '#888888', inactive: 'rgba(136, 136, 136, 0.3)' };
    }
  }, [path]);

  // Create 10 stage balls
  const balls = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const ballStage = i + 1;
        const isActive = ballStage === stage;
        const angle = (i / 10) * 360; // 0° to 360° around orbit
        const radius = 60; // pixels from center

        // 3D elliptical path: Z varies from -40px to +40px
        const zDepth = Math.sin((angle * Math.PI) / 180) * 40;
        const isBackBall = zDepth < -12; // Behind silhouette threshold

        return {
          stage: ballStage,
          angle,
          radius,
          zDepth,
          isActive,
          isBackBall,
          x: radius * Math.cos((angle * Math.PI) / 180),
          y: radius * Math.sin((angle * Math.PI) / 180),
        };
      }),
    [stage]
  );

  // Separate front and back balls for layering
  const frontBalls = balls.filter((b) => !b.isBackBall);
  const backBalls = balls.filter((b) => b.isBackBall);

  return (
    <div className={`relative ${className}`} style={{ perspective: '1200px' }}>
      {/* Back orbit balls (z-index: 5, behind silhouette) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          zIndex: 5,
          transform: 'rotateX(75deg)', // 3D tilt for elliptical appearance
        }}
      >
        {backBalls.map((ball) => (
          <div
            key={`back-${ball.stage}`}
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: '16px',
              height: '16px',
              left: `calc(50% + ${ball.x}px)`,
              top: `calc(50% + ${ball.y}px)`,
              transform: `translate(-50%, -50%) translateZ(${ball.zDepth}px)`,
              background: ball.isActive ? ball.ballColor.active : ball.ballColor.inactive,
              boxShadow: ball.isActive
                ? `0 0 16px ${ball.ballColor.active}, inset 0 0 8px rgba(255,255,255,0.3)`
                : `0 0 4px rgba(0,0,0,0.5)`,
              opacity: ball.isActive ? 1 : 0.6,
              animation: `orbit-ball ${orbitDuration}s linear infinite`,
              animationDirection: orbitDirection,
              animationDelay: `${(ball.stage - 1) * (-orbitDuration / 10)}s`,
            }}
            aria-label={`Stage ${ball.stage}`}
          />
        ))}
      </div>

      {/* Front orbit balls (z-index: 20, in front of silhouette) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          zIndex: 20,
          transform: 'rotateX(75deg)',
        }}
      >
        {frontBalls.map((ball) => (
          <div
            key={`front-${ball.stage}`}
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: '16px',
              height: '16px',
              left: `calc(50% + ${ball.x}px)`,
              top: `calc(50% + ${ball.y}px)`,
              transform: `translate(-50%, -50%) translateZ(${ball.zDepth}px)`,
              background: ball.isActive ? ball.ballColor.active : ball.ballColor.inactive,
              boxShadow: ball.isActive
                ? `0 0 16px ${ball.ballColor.active}, inset 0 0 8px rgba(255,255,255,0.3)`
                : `0 0 4px rgba(0,0,0,0.5)`,
              opacity: ball.isActive ? 1 : 0.6,
              animation: `orbit-ball ${orbitDuration}s linear infinite`,
              animationDirection: orbitDirection,
              animationDelay: `${(ball.stage - 1) * (-orbitDuration / 10)}s`,
            }}
            aria-label={`Stage ${ball.stage}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes orbit-ball {
          0% {
            transform: rotate(0deg) translateX(60px) rotate(0deg) translateZ(var(--z));
          }
          100% {
            transform: rotate(360deg) translateX(60px) rotate(-360deg) translateZ(var(--z));
          }
        }
      `}</style>
    </div>
  );
}
