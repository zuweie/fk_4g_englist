const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const User = require('../modules/user/db');

async function createAdminUser() {
    try {
        // 检查数据库是否存在
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        
        const adminDb = client.db('admin');
        const dbs = await adminDb.admin().listDatabases();
        const dbExists = dbs.databases.some(db => db.name === process.env.WEB_NAME);
        
        if (!dbExists) {
            console.log(`创建数据库: ${process.env.WEB_NAME}`);
            // 创建数据库和一个初始集合(MongoDB 要求)
            const newDb = client.db(process.env.WEB_NAME);
            await newDb.createCollection('users');
        }
        
        await client.close();
        // 连接到指定的数据库
        console.log(process.env.MONGODB_URI.replace('?', `/${process.env.WEB_NAME}?`));
        await mongoose.connect(process.env.MONGODB_URI.replace('?', `/${process.env.WEB_NAME}?`), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // 检查是否已存在管理员
        const adminExists = await User.findOne({ permission: 3 });
        if (adminExists) {
            console.log('管理员用户已存在');
            process.exit(0);
        }

        // 生成密码的盐值
        const salt = await bcrypt.genSalt(10);
        // 使用盐值对密码进行哈希
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // 创建管理员用户
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            permission: 3,
            avatar: '/images/default-avatar.png'
        });

        await adminUser.save();
        console.log('管理员用户创建成功');
    } catch (err) {
        console.error('初始化失败:', err);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

createAdminUser(); 