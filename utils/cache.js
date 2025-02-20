const Redis = require('redis');

class RedisCache {
    constructor() {
        this.client = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', err => console.error('Redis Error:', err));
        this.client.on('connect', () => console.log('Redis Connected'));
        this.client.on('ready', () => console.log('Redis Ready'));

        this.connect().catch(console.error);
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await this.connect();
            return await this.client.set(key, JSON.stringify(value), { EX: ttl });
        } catch (error) {
            console.error(`Cache SET Error (${key}):`, error);
            return false;
        }
    }

    async get(key) {
        try {
            await this.connect();
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Cache GET Error (${key}):`, error);
            return null;
        }
    }

    async keys() {
        try {
            await this.connect();
            return await this.client.keys('*');
        } catch (error) {
            console.error('Cache KEYS Error:', error);
            return [];
        }
    }

    async flushAll() {
        try {
            await this.connect();
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Cache FLUSH Error:', error);
            return false;
        }
    }
}

module.exports = new RedisCache(); 