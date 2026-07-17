import { resetPasswordSchema } from './auth';

// ============================================================
// resetPasswordSchema — validation nouveau mot de passe
// (BIKETRIP-P1-AUTH-ROUTING-002)
// ============================================================

describe('resetPasswordSchema', () => {
  it('accepte un mot de passe valide avec confirmation identique', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un mot de passe trop court', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Pass1',
      confirmPassword: 'Pass1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it('rejette un mot de passe sans majuscule', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Passwordxx',
      confirmPassword: 'Passwordxx',
    });
    expect(result.success).toBe(false);
  });

  it('rejette des mots de passe non identiques', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });
});
