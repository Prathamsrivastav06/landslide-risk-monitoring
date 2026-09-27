const request = require('supertest');
const app = require('../src/index');

describe('Rainfall Endpoints', () => {
  it('should require valid coordinates', async () => {
    const res = await request(app).get('/api/rainfall');
    expect(res.statusCode).toEqual(400);
  });
});
