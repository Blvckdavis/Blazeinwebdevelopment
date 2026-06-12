import { useEffect, useState } from 'react';
import type { CultivationPath } from '@types/cultivation';

interface TribulationEffectProps {
  isVisible: boolean;
  success: boolean;
  path: CultivationPath;
  onComplete?: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function TribulationEffect({
  isVisible,
  success,
  path,
  onComplete,
}: TribulationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [messageOpacity, setMessageOpacity] = useState(0);

  // Determine colors based on path and outcome
  const colors = {
    magicka: '#4A90E2',
    corporia: '#DC2626',
    gold: '#D97706',
  };

  const effectColor = path === 'Magicka' ? colors.magicka : colors.corporia;
  const message = success ? 'Tribulation Passed' : 'Tribulation Failed';

  // Initialize effect on visibility
  useEffect(() => {
    if (!isVisible) return;

    // Lightning flash
    setFlashOpacity(1);
    const flashTimer = setTimeout(() => {
      setFlashOpacity(0);
    }, 500); // 500ms flash duration

    // Message appearance (delayed slightly)
    setTimeout(() => {
      setMessageOpacity(1);
    }, 100);

    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = success ? 12 : 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 200 + Math.random() * 100;
      newParticles.push({
        id: `particle-${i}`,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: success ? 1.5 : 2,
      });
    }
    setParticles(newParticles);

    // Cleanup on completion
    const completionTimer = setTimeout(() => {
      onComplete?.();
    }, 3000); // Total effect duration

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(completionTimer);
    };
  }, [isVisible, onComplete, success]);

  // Animate particles
  useEffect(() => {
    if (!isVisible || particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.016, // 60fps delta
            y: p.y + p.vy * 0.016,
            life: p.life - 0.016 / p.maxLife,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isVisible, particles.length]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      {/* Lightning Flash Background */}
      <div
        className="absolute inset-0 transition-opacity duration-100"
        style={{
          background: '#ffffff',
          opacity: flashOpacity * 0.8,
          pointerEvents: 'none',
        }}
      />

      {/* Success/Failure Message */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: messageOpacity,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <h2
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: effectColor,
            textShadow: `
              0 0 20px ${effectColor},
              0 0 40px ${effectColor},
              0 2px 8px rgba(0,0,0,0.5)
            `,
            letterSpacing: '2px',
            animation: success ? 'message-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'message-crack 0.8s ease-out',
            fontFamily: 'monospace',
            zIndex: 10000,
          }}
        >
          {message}
        </h2>
      </div>

      {/* Particles */}
      {particles.map((particle) => {
        const particleOpacity = particle.life > 0.5 ? 1 : particle.life * 2;
        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: success ? '8px' : '6px',
              height: success ? '8px' : '6px',
              background: success ? colors.gold : effectColor,
              boxShadow: `0 0 ${success ? 8 : 4}px ${effectColor}`,
              opacity: particleOpacity,
              transform: `translate(-50%, -50%) scale(${particle.life})`,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Crack Pattern for Failure */}
      {!success && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: messageOpacity * 0.4 }}
          preserveAspectRatio="none"
        >
          <g stroke={effectColor} strokeWidth="2" fill="none" opacity="0.6">
            {/* Center radial cracks */}
            <line
              x1="50%"
              y1="50%"
              x2="20%"
              y2="20%"
              style={{ animation: 'crack-appear 0.6s ease-out' }}
            />
            <line
              x1="50%"
              y1="50%"
              x2="80%"
              y2="20%"
              style={{ animation: 'crack-appear 0.6s ease-out 0.1s both' }}
            />
            <line
              x1="50%"
              y1="50%"
              x2="80%"
              y2="80%"
              style={{ animation: 'crack-appear 0.6s ease-out 0.2s both' }}
            />
            <line
              x1="50%"
              y1="50%"
              x2="20%"
              y2="80%"
              style={{ animation: 'crack-appear 0.6s ease-out 0.3s both' }}
            />
          </g>
        </svg>
      )}

      <style>{`
        @keyframes message-pop {
          0% {
            transform: scale(0.5) rotate(-5deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes message-crack {
          0% {
            transform: scale(0.8) rotateZ(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotateZ(2deg);
          }
          100% {
            transform: scale(1) rotateZ(0deg);
            opacity: 1;
          }
        }

        @keyframes crack-appear {
          0% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
