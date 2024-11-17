const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./api/index');

const DATA_FILE = path.join(__dirname, './data.json');

let originalData;

beforeAll(() => {
    // Backup the original data before running tests
    originalData = fs.readFileSync(DATA_FILE, 'utf-8');
});

afterAll(() => {
    // Restore the original data after all tests are done
    fs.writeFileSync(DATA_FILE, originalData);

});

describe('User Management API Tests', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/register')
            .send({
                username: 'testUser',
                email: 'testuser@example.com',
                password: 'securepassword'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('User registered successfully');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.username).toEqual('testUser');
    });

    it('should not register a user with an existing email', async () => {
        const res = await request(app)
            .post('/register')
            .send({
                username: 'testUser',
                email: 'testuser@example.com',
                password: 'securepassword'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Username already exists');
    });

    it('should get all users without passwords', async () => {
        const res = await request(app).get('/users');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);

        if (res.body.length > 0) {
            expect(res.body[0]).not.toHaveProperty('password');
        }
    });

    it('should get a specific user by ID', async () => {
        const allUsers = await request(app).get('/users');
        const firstUserId = allUsers.body[0].id;

        const res = await request(app).get(`/users/${firstUserId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', firstUserId);
        expect(res.body).not.toHaveProperty('password');
    });

    it('should delete a user by ID', async () => {
        const allUsers = await request(app).get('/users');
        const firstUserId = allUsers.body[0].id;

        const res = await request(app).delete(`/users/${firstUserId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('User deleted successfully');
    });

    it('should fail to delete a non-existent user', async () => {
        const res = await request(app).delete('/users/nonexistent-id');
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('User not found');
    });

    it('should allow user login with correct credentials', async () => {
        await request(app)
            .post('/register')
            .send({
                username: 'loginUser',
                email: 'loginuser@example.com',
                password: 'loginpassword'
            });

        const res = await request(app)
            .post('/login')
            .send({
                email: 'loginuser@example.com',
                password: 'loginpassword'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Login successful');
        expect(res.body.user).toHaveProperty('id');
    });

    it('should not allow login with incorrect password', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'loginuser@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body.error).toEqual('Invalid email or password provided');
    });
});
