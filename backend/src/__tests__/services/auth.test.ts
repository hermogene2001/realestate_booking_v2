import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+250781234567',
        password: 'password123',
        role: 'TENANT' as const,
      };

      const result = await AuthService.register(userData);

      expect(result.user).toHaveProperty('id');
      expect(result.user.name).toBe(userData.name);
      expect(result.user.email).toBe(userData.email);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        phone: '+250781234568',
        password: 'password123',
        role: 'TENANT' as const,
      };

      await AuthService.register(userData);

      await expect(AuthService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const userData = {
        name: 'Login Test',
        email: 'login@example.com',
        phone: '+250781234569',
        password: 'password123',
        role: 'TENANT' as const,
      };

      await AuthService.register(userData);

      const result = await AuthService.login(userData.email, userData.password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id');
    });

    it('should throw error with wrong password', async () => {
      const userData = {
        name: 'Wrong Pass',
        email: 'wrong@example.com',
        phone: '+250781234570',
        password: 'password123',
        role: 'TENANT' as const,
      };

      await AuthService.register(userData);

      await expect(
        AuthService.login(userData.email, 'wrongpassword')
      ).rejects.toThrow();
    });
  });
});
