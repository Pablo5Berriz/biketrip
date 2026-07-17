// ============================================================
// authService — resetPassword / exchangeRecoveryCode / updatePassword
// (BIKETRIP-P1-AUTH-ROUTING-002)
// ============================================================

import { resetPassword, exchangeRecoveryCode, updatePassword } from './authService';

const mockResetPasswordForEmail = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

describe('resetPassword', () => {
  beforeEach(() => {
    mockResetPasswordForEmail.mockReset();
  });

  it('appelle mockResetPasswordForEmail avec le bon redirectTo (route reset-password réelle)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    await resetPassword('user@example.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'biketrip://auth/reset-password',
    });
  });

  it('retourne success:true si Supabase ne renvoie pas d\'erreur', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const result = await resetPassword('user@example.com');
    expect(result.success).toBe(true);
  });

  it('retourne success:false avec message mappé si Supabase renvoie une erreur', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
    const result = await resetPassword('user@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Aucun compte trouvé avec cet email.');
  });
});

describe('exchangeRecoveryCode', () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
  });

  it('retourne success:true quand le code est échangé avec succès', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null });
    const result = await exchangeRecoveryCode('valid-code');
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    expect(result.success).toBe(true);
  });

  it('retourne success:false quand le code/callback est invalide ou expiré', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'invalid flow state, no valid flow state found' },
    });
    const result = await exchangeRecoveryCode('bad-code');
    expect(result.success).toBe(false);
  });

  it('retourne success:false en cas d\'erreur réseau (exception)', async () => {
    mockExchangeCodeForSession.mockRejectedValue(new Error('network down'));
    const result = await exchangeRecoveryCode('any-code');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Erreur réseau.');
  });
});

describe('updatePassword', () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  it('appelle supabase.auth.mockUpdateUser avec le nouveau mot de passe', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    await updatePassword('NewPassword1');
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword1' });
  });

  it('retourne success:true en cas de succès', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    const result = await updatePassword('NewPassword1');
    expect(result.success).toBe(true);
  });

  it('retourne success:false avec message mappé si Supabase refuse (ex. mot de passe identique à l\'ancien)', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'New password should be different from the old password' },
    });
    const result = await updatePassword('SamePassword1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Le nouveau mot de passe doit être différent de l\'ancien.');
  });

  it('retourne success:false en cas d\'erreur réseau (exception)', async () => {
    mockUpdateUser.mockRejectedValue(new Error('network down'));
    const result = await updatePassword('NewPassword1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Erreur réseau.');
  });
});
