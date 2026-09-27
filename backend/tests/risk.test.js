const request = require('supertest');
const app = require('../src/index');

describe('Risk Endpoints', () => {
  it('should return 400 for invalid coordinates', async () => {
    const res = await request(app).get('/api/risk?lat=abc&lon=def');
    expect(res.statusCode).toEqual(400);
  });

  it('should return 400 if coordinates are outside NER', async () => {
    const res = await request(app).get('/api/risk?lat=12.0&lon=77.0'); // Bangalore
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('outside');
  });
});
