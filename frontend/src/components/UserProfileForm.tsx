import React, { useState } from 'react';
import type { UserProfile, Sex, EquipmentCategory } from '../types';

interface UserProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSubmit, isLoading }) => {
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [age, setAge] = useState<string>('25');
  const [sex, setSex] = useState<Sex>('masculino');
  const [split, setSplit] = useState<'Tren Superior' | 'Tren Inferior' | 'Full Body'>('Tren Superior');
  const [goal, setGoal] = useState<'Perder Peso' | 'Volumen' | 'Mantenerse Activo'>('Volumen');
  const [equipment, setEquipment] = useState<EquipmentCategory>('gym');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      age: Number(age),
      sex,
      experience: 'intermediate',
      split,
      goal,
      equipment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', textAlign: 'center' }}>
        Configura tu Perfil & Objetivo
      </h2>

      <div className="input-group">
        <label>Género</label>
        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div
            className={`pill-option ${sex === 'masculino' ? 'active' : ''}`}
            onClick={() => setSex('masculino')}
          >
            Masculino
          </div>
          <div 
            className={`pill-option ${sex === 'femenino' ? 'active' : ''}`}
            onClick={() => setSex('femenino')}
          >
            Femenino
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="input-group">
          <label htmlFor="weight">Peso (kg)</label>
          <input
            id="weight"
            type="number"
            min="30"
            max="250"
            className="form-input"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="height">Altura (cm)</label>
          <input
            id="height"
            type="number"
            min="100"
            max="250"
            className="form-input"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="input-group">
          <label htmlFor="age">Edad (años)</label>
          <input
            id="age"
            type="number"
            min="12"
            max="100"
            className="form-input"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="input-group">
        <label>Bloque Anatómico (Split)</label>
        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div 
            className={`pill-option ${split === 'Tren Superior' ? 'active' : ''}`}
            onClick={() => setSplit('Tren Superior')}
            style={{ fontSize: '0.75rem' }}
          >
            Superior
          </div>
          <div 
            className={`pill-option ${split === 'Tren Inferior' ? 'active' : ''}`}
            onClick={() => setSplit('Tren Inferior')}
            style={{ fontSize: '0.75rem' }}
          >
            Inferior
          </div>
          <div 
            className={`pill-option ${split === 'Full Body' ? 'active' : ''}`}
            onClick={() => setSplit('Full Body')}
            style={{ fontSize: '0.75rem' }}
          >
            Full Body
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>Objetivo Principal</label>
        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div 
            className={`pill-option ${goal === 'Perder Peso' ? 'active' : ''}`}
            onClick={() => setGoal('Perder Peso')}
            style={{ fontSize: '0.75rem' }}
          >
            Definir
          </div>
          <div 
            className={`pill-option ${goal === 'Volumen' ? 'active' : ''}`}
            onClick={() => setGoal('Volumen')}
            style={{ fontSize: '0.75rem' }}
          >
            Hipertrofia
          </div>
          <div 
            className={`pill-option ${goal === 'Mantenerse Activo' ? 'active' : ''}`}
            onClick={() => setGoal('Mantenerse Activo')}
            style={{ fontSize: '0.75rem' }}
          >
            Salud
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>Material Disponible</label>
        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div
            className={`pill-option ${equipment === 'gym' ? 'active' : ''}`}
            onClick={() => setEquipment('gym')}
            style={{ fontSize: '0.75rem' }}
          >
            Gimnasio 🏋️
          </div>
          <div
            className={`pill-option ${equipment === 'none' ? 'active' : ''}`}
            onClick={() => setEquipment('none')}
            style={{ fontSize: '0.75rem' }}
          >
            Sin material 🤸
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '1rem', padding: '0.95rem' }}
        disabled={isLoading}
      >
        {isLoading ? 'Generando rutina...' : 'Generar Rutina ⚡'}
      </button>
    </form>
  );
};
