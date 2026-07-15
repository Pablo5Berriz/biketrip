import { SURFACE_LABELS } from './labels';

describe('labels', () => {
  it('exposes readable surface labels', () => {
    expect(SURFACE_LABELS.ASPHALT).toBeTruthy();
  });
});
