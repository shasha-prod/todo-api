const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/db');

let server;

beforeAll(async () => {
  server = app.listen(4000);
  await pool.query('DELETE FROM todos');
});

afterAll(async () => {
  await pool.query('DELETE FROM todos');
  await pool.end();
  server.close();
});

describe('Health Check', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Todos API', () => {
  let todoId;

  test('POST /api/todos creates a todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Test todo' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test todo');
    expect(res.body.completed).toBe(false);
    todoId = res.body.id;
  });

  test('GET /api/todos returns all todos', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/todos/:id returns single todo', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test todo');
  });

  test('PUT /api/todos/:id updates a todo', async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('DELETE /api/todos/:id deletes a todo', async () => {
    const res = await request(app)
      .delete(`/api/todos/${todoId}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/todos/:id returns 404 for deleted todo', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`);
    expect(res.status).toBe(404);
  });

  test('POST /api/todos without title returns 400', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});
    expect(res.status).toBe(400);
  });
});