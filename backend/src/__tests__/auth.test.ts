
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';

// Mock email sending so tests never depend on an external SMTP server.
jest.mock('../../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    verifyEmail: jest.fn(() => '<p>Verify your email</p>'),
    resetPassword: jest.fn(() => '<p>Reset your password</p>'),
    appointmentConfirmed: jest.fn(() => '<p>Appointment confirmed</p>'),
  },
}));

describe('Auth API', () => {
  const testEmail = `test_jest_${Date.now()}@example.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test_jest_' } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  describe('POST /api/auth/signup', () => {
    it('creates a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'Password1',
          fullName: 'Test User',
          role: 'PARENT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.password).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'Password1',
          fullName: 'Test User',
        });

      expect(res.status).toBe(409);
    });

    it('validates password strength', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'weak',
          fullName: 'Test',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword1',
        });

      expect(res.status).toBe(401);
    });

    it('rejects login when email is not verified', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password1',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('always returns 200 for a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
    });
  });
});
