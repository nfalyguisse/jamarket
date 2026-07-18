/**
 * Smoke e2e conservé pour valider le runner sans DB.
 * Les parcours métier sont dans vital-paths.e2e-spec.ts.
 */
import { describe, expect, it } from 'vitest';

describe('Vitest e2e runner (smoke)', () => {
  it('est opérationnel', () => {
    expect(true).toBe(true);
  });
});
