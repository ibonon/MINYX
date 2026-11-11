import { describe, expect, it } from 'vitest';
import { ELEMENTS, FORMS, addXP, getFormForLevel, xpForLevel, type Companion } from './index';

function makeCompanion(overrides: Partial<Companion> = {}): Companion {
  return {
    id: 'co-1',
    name: 'Nyx',
    element: 'Feu',
    form: 'Chibi',
    level: 1,
    xp: 0,
    xpToNextLevel: xpForLevel(2),
    stats: { INT: 10, EMO: 10, AGI: 10, BOND: 10 },
    createdAt: new Date(0),
    lastInteraction: new Date(0),
    ...overrides,
  };
}

describe('xpForLevel', () => {
  it('suit la courbe floor(100 * level^1.5)', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(282);
    expect(xpForLevel(4)).toBe(800);
  });

  it('est strictement croissante', () => {
    for (let level = 1; level < 100; level++) {
      expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
    }
  });
});

describe('getFormForLevel', () => {
  it('applique les paliers d’évolution', () => {
    expect(getFormForLevel(1)).toBe('Chibi');
    expect(getFormForLevel(9)).toBe('Chibi');
    expect(getFormForLevel(10)).toBe('Éveillé');
    expect(getFormForLevel(24)).toBe('Éveillé');
    expect(getFormForLevel(25)).toBe('Évolué');
    expect(getFormForLevel(50)).toBe('Transcendant');
    expect(getFormForLevel(80)).toBe('Légendaire');
  });

  it('retourne toujours une forme connue', () => {
    for (let level = 1; level <= 120; level++) {
      expect(FORMS).toContain(getFormForLevel(level));
    }
  });
});

describe('addXP', () => {
  it('n’augmente pas le niveau tant que le seuil n’est pas atteint', () => {
    const result = addXP(makeCompanion(), 99);
    expect(result.leveledUp).toBe(false);
    expect(result.companion.level).toBe(1);
    expect(result.companion.xp).toBe(99);
  });

  it('monte de niveau exactement au seuil', () => {
    const result = addXP(makeCompanion(), xpForLevel(2));
    expect(result.leveledUp).toBe(true);
    expect(result.companion.level).toBe(2);
    expect(result.companion.xp).toBe(0);
  });

  it('gère plusieurs niveaux d’un coup', () => {
    const gain = xpForLevel(2) + xpForLevel(3);
    const result = addXP(makeCompanion(), gain);
    expect(result.companion.level).toBe(3);
    expect(result.companion.xp).toBe(0);
  });

  it('déclenche l’évolution en franchissant un palier', () => {
    const result = addXP(makeCompanion({ level: 9, form: 'Chibi' }), xpForLevel(10));
    expect(result.companion.level).toBe(10);
    expect(result.newForm).toBe('Éveillé');
    expect(result.companion.form).toBe('Éveillé');
  });

  it('ne signale aucune évolution si le palier est déjà franchi', () => {
    const result = addXP(makeCompanion({ level: 11, form: 'Éveillé' }), xpForLevel(12));
    expect(result.companion.level).toBe(12);
    expect(result.newForm).toBeUndefined();
  });

  it('met à jour xpToNextLevel', () => {
    const result = addXP(makeCompanion(), xpForLevel(2));
    expect(result.companion.xpToNextLevel).toBe(xpForLevel(3));
  });

  it('ne mute jamais la statistique BOND (domaine XP uniquement)', () => {
    const result = addXP(makeCompanion(), xpForLevel(2) * 5);
    expect(result.companion.stats).toEqual({ INT: 10, EMO: 10, AGI: 10, BOND: 10 });
  });
});

describe('catalogue des éléments', () => {
  it('contient les 7 éléments canoniques', () => {
    expect(ELEMENTS).toHaveLength(7);
    expect(ELEMENTS).toContain('Cosmos');
  });
});
