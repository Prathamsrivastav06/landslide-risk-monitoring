const request = require('supertest');
const app = require('../src/index');

describe('Terrain Endpoints', () => {
  it('should require valid coordinates', async () => {
    const res = await request(app).get('/api/terrain');
    expect(res.statusCode).toEqual(400);
  });
});
