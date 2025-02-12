const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// 验证token中间件
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/admin/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.permission < 3) {
            return res.status(401).send('权限不足');
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.redirect('/admin/login');
    }
};

// 登录页面
router.get('/login', (req, res) => {
    res.render('admin/login');
});

// 后台首页
router.get('/index', verifyToken, async (req, res) => {
    try {
        // 读取所有模块配置
        const modulesPath = path.join(__dirname, '../modules');
        const modules = [];
        
        const dirs = await fs.readdir(modulesPath);
        for (const dir of dirs) {
            const configPath = path.join(modulesPath, dir, 'config.json');
            try {
                const config = require(configPath);
                if (config.inuse) {
                    modules.push(config);
                }
            } catch (err) {
                console.error(`Error loading config for module ${dir}:`, err);
            }
        }
        
        res.render('admin/index', { modules, user: req.user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 添加根路由重定向
router.get('/', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/admin/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.permission < 3) {
            return res.status(401).send('权限不足');
        }
        res.redirect('/admin/index');
    } catch (err) {
        res.redirect('/admin/login');
    }
});

module.exports = router; 