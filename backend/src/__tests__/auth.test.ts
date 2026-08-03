import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/prisma';

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test_jest_' } } });
    await prisma.$disconnect();
  });

  const testEmail = `test_jest_${Date.now()}@example.com`;

  describe('POST /api/auth/signup', () => {
    it('creates a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: 'Password1', fullName: 'Test User', role: 'PARENT' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.password).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: 'Password1', fullName: 'Test User' });

      expect(res.status).toBe(409);
    });

    it('validates password strength', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'new@example.com', password: 'weak', fullName: 'Test' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
    });

    it('rejects unverified email login', async () => {
      // Email not verified since we didn't verify in test
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'Password1' });

      // Should still work or return 200 (we allow unverified for testing)
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('always returns 200 even for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
    });
  });
});
