const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');

// load the user data
const loadUsers = () => {
    try {
        // Check if the file exists
        if (!fs.existsSync(DATA_FILE)) {
            console.log('data.json does not exist. Initializing with default data...');
            const defaultUsers = [
                {
                    id: '1',
                    username: 'defaultUser',
                    email: 'default@example.com',
                    password: '$2b$10$hashedpassword'
                }
            ];
            saveUsers(defaultUsers);
            return defaultUsers;
        }

        // Read and parse the file
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        if (!data.trim()) {
            console.log('data.json is empty. Initializing with default data...');
            const defaultUsers = [
                {
                    id: '1',
                    username: 'defaultUser',
                    email: 'default@example.com',
                    password: '$2b$10$hashedpassword'
                }
            ];
            saveUsers(defaultUsers);
            return defaultUsers;
        }

        const users = JSON.parse(data);

        // Validate that the parsed data is an array
        if (!Array.isArray(users)) {
            throw new Error('Invalid data format in data.json');
        }

        return users;
    } catch (err) {
        console.error(`Failed to load users: ${err.message}`);
        const defaultUsers = [
            {
                id: '1',
                username: 'defaultUser',
                email: 'default@example.com',
                password: '$2b$10$hashedpassword'
            }
        ];
        saveUsers(defaultUsers);
        return defaultUsers;
    }
};


// Helper function Save users to `data.json`
const saveUsers = (users) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};


// Validate New User
const validateNewUser = async (newUser) => {
    const users = loadUsers();
    const { username, email, password } = newUser;

    if (!username || !email || !password) {
        throw new Error('All fields (username, email, password) are required');
    }

    if (typeof username !== 'string' || username.trim() === '') {
        throw new Error('Username must be a non-empty string');
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        throw new Error('Invalid email format');
    }

    if (typeof password !== 'string' || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }

    if (users.some(user => user.username === username)) {
        throw new Error('Username already exists');
    }

    if (users.some(user => user.email === email)) {
        throw new Error('Email already exists');
    }
};

// Add User
const addUser = async (newUser) => {
    const users = loadUsers();
    await validateNewUser(newUser);

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    const user = { id, ...newUser, password: hashedPassword };

    users.push(user);
    saveUsers(users);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// Get User by ID
const getUserById = (id) => {
    const users = loadUsers();
    const user = users.find(user => user.id === id);

    if (!user) {
        throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// Get All Users
const getAllUsers = () => {
    const users = loadUsers();
    return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
};

// Validate Login
const validateLogin = async (email, password) => {
    const users = loadUsers();
    const user = users.find(user => user.email === email);

    // user not found by email
    if (!user) {
        throw new Error('Invalid email or password provided');
    }

    // Compare the user's hash password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password provided');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// Delete User
const deleteUser = (id) => {
    const users = loadUsers();
    const updatedUsers = users.filter(user => user.id !== id);

    if (updatedUsers.length === users.length) {
        throw new Error('User not found');
    }

    saveUsers(updatedUsers); // Save updated users to file
};

module.exports = {
    addUser,
    deleteUser,
    getUserById,
    getAllUsers,
    validateLogin,
};
