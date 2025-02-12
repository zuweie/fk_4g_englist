const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    avatar: {
        type: String,
        default: '/images/default-avatar.png'
    },
    password: {
        type: String,
        required: true
    },
    permission: {
        type: Number,
        default: 1
    },
    openid: {
        type: String,
        default: ''
    },
    token: {
        type: String,
        default: ''
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('User', userSchema); 