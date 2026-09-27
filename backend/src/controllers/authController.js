const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const { success, error } = require('../utils/responseUtils');

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        const existing = await userModel.findByEmail(email);
        if (existing) return error(res, 'Email already in use', 400);

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userModel.createUser({
            id: uuidv4(),
            name, email, passwordHash, role: 'CITIZEN', phone
        });

        success(res, user, 201);
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return error(res, 'Invalid credentials', 401);
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        success(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return error(res, 'User not found', 404);
        success(res, user);
    } catch (err) { next(err); }
};
