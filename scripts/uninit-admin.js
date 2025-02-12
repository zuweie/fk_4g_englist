const { MongoClient } = require('mongodb');
require('dotenv').config();

async function uninitDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        
        // 检查数据库是否存在
        const adminDb = client.db('admin');
        const dbs = await adminDb.admin().listDatabases();
        const dbExists = dbs.databases.some(db => db.name === process.env.WEB_NAME);
        
        if (dbExists) {
            console.log(`正在删除数据库: ${process.env.WEB_NAME}`);
            const db = client.db(process.env.WEB_NAME);
            await db.dropDatabase();
            console.log(`数据库 ${process.env.WEB_NAME} 已删除`);
        } else {
            console.log(`数据库 ${process.env.WEB_NAME} 不存在`);
        }
    } catch (err) {
        console.error('卸载过程出错:', err);
    } finally {
        await client.close();
    }
}

uninitDatabase(); 