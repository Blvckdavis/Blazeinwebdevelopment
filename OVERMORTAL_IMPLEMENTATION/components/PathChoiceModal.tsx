import { useState } from 'react';
import type { CultivationPath } from '@types/cultivation';
import { PATH_CONFIG } from '@types/cultivation';

interface PathChoiceModalProps {
  isVisible: boolean;
  onPathSelected: (path: CultivationPath) => void;
}

export function PathChoiceModal({
  isVisible,
  onPathSelected,
}: PathChoiceModalProps) {
  const [selectedPath, setSelectedPath] = useState<CultivationPath>(null);

  const handleConfirm = () => {
    if (selectedPath) {
      onPathSelected(selectedPath);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-lg p-8"
        style={{
          background: 'rgba(20, 30, 40, 0.95)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#E8DCC8',
            textAlign: 'center',
            marginBottom: '12px',
            textShadow: '0 0 8px rgba(232, 220, 200, 0.3)',
          }}
        >
          Path Choice: Artifact Awakening
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#A89660',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          Select your cultivation path. This choice is permanent.
        </p>

        {/* Path Cards */}
        <div
          className="grid grid-cols-2 gap-6 mb-8"
          style={{ perspective: '1000px' }}
        >
          {/* Magicka Path */}
          <button
            onClick={() => setSelectedPath('Magicka')}
            className="group relative rounded-lg p-6 transition-all duration-300 cursor-pointer"
            style={{
              background:
                selectedPath === 'Magicka'
                  ? 'rgba(74, 144, 226, 0.2)'
                  : 'rgba(30, 58, 138, 0.1)',
              border: `2px solid ${selectedPath === 'Magicka' ? '#4A90E2' : '#1E3A8A'}`,
              transform:
                selectedPath === 'Magicka'
                  ? 'scale(1.05) translateZ(20px)'
                  : 'scale(1) translateZ(0)',
              boxShadow:
                selectedPath === 'Magicka'
                  ? '0 0 20px rgba(74, 144, 226, 0.4)'
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#4A90E2',
                marginBottom: '8px',
                textShadow: '0 0 4px rgba(74, 144, 226, 0.5)',
              }}
            >
              Magicka
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: '#B0D4F5',
                marginBottom: '12px',
              }}
            >
              Path of Speed and Insight
            </p>
            <div style={{ fontSize: '12px', color: '#A89660', textAlign: 'left' }}>
              <p style={{ marginBottom: '6px', color: '#4A90E2' }}>✓ 1.5× Qi Absorption</p>
              <p style={{ marginBottom: '6px', color: '#D94A2B' }}>✗ 15% Health Penalty</p>
              <p style={{ marginTop: '12px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                "Swift as lightning, keen as frost. Sacrifice durability for enlightenment."
              </p>
            </div>
          </button>

          {/* Corporia Path */}
          <button
            onClick={() => setSelectedPath('Corporia')}
            className="group relative rounded-lg p-6 transition-all duration-300 cursor-pointer"
            style={{
              background:
                selectedPath === 'Corporia'
                  ? 'rgba(220, 38, 38, 0.2)'
                  : 'rgba(139, 0, 0, 0.1)',
              border: `2px solid ${selectedPath === 'Corporia' ? '#DC2626' : '#8B0000'}`,
              transform:
                selectedPath === 'Corporia'
                  ? 'scale(1.05) translateZ(20px)'
                  : 'scale(1) translateZ(0)',
              boxShadow:
                selectedPath === 'Corporia'
                  ? '0 0 20px rgba(220, 38, 38, 0.4)'
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#DC2626',
                marginBottom: '8px',
                textShadow: '0 0 4px rgba(220, 38, 38, 0.5)',
              }}
            >
              Corporia
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: '#F5B0B0',
                marginBottom: '12px',
              }}
            >
              Path of Strength and Resilience
            </p>
            <div style={{ fontSize: '12px', color: '#A89660', textAlign: 'left' }}>
              <p style={{ marginBottom: '6px', color: '#DC2626' }}>✓ 1.5× Health & Physique</p>
              <p style={{ marginBottom: '6px', color: '#D94A2B' }}>✗ 25% Qi Penalty</p>
              <p style={{ marginTop: '12px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                "Steady as stone, unbreakable as steel. Sacrifice speed for supremacy."
              </p>
            </div>
          </button>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            disabled={!selectedPath}
            onClick={handleConfirm}
            className="px-8 py-3 rounded-lg font-bold transition-all duration-200"
            style={{
              background:
                selectedPath === 'Magicka'
                  ? '#4A90E2'
                  : selectedPath === 'Corporia'
                    ? '#DC2626'
                    : '#666666',
              color: '#ffffff',
              cursor: selectedPath ? 'pointer' : 'not-allowed',
              opacity: selectedPath ? 1 : 0.5,
              transform: selectedPath ? 'scale(1)' : 'scale(0.95)',
              boxShadow: selectedPath
                ? `0 0 12px ${selectedPath === 'Magicka' ? 'rgba(74, 144, 226, 0.5)' : 'rgba(220, 38, 38, 0.5)'}`
                : 'none',
            }}
          >
            Confirm Path
          </button>
        </div>

        <p
          style={{
            fontSize: '11px',
            color: '#D94A2B',
            textAlign: 'center',
            marginTop: '16px',
            fontStyle: 'italic',
          }}
        >
          ⚠ This choice cannot be changed after confirmation.
        </p>
      </div>
    </div>
  );
}
