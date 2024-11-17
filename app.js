const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // For logging

const { getAllUsers, addUser, deleteUser, getUserById, validateLogin } = require('./components/getObjects');


const app = express();
app.use(bodyParser.json());

// Logging Middleware
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    fs.appendFileSync('server.log', log);
    console.log(log);
    next();
});


// Get All Users, default get all user objects.This if for my take home assignment only. In production, this should be not be available
app.get('/users', (req, res) => {
    try {
        const users = getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by id
app.get('/users/:id', (req, res) => {
    try {
        const id = req.params.id;
        const user = getUserById(id);

        res.status(200).json(user);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Add User (Register)
app.post('/register', async (req, res) => {
    try {
        const newUser = req.body;
        const user = await addUser(newUser);
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login for the user by email and password
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await validateLogin(email, password);
        res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// Delete useer object
app.delete('/users/:id', (req, res) => {
    try {
        const id = req.params.id;
        deleteUser(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});


const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
module.exports = { app, server} ;