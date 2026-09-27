const request = require('supertest');
const app = require('../src/index');

describe('Auth Endpoints', () => {
  it('should reject access without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
