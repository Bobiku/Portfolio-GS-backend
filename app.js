const express = require('express');
const cors = require('cors');
const compression = require('compression');
const redis = require('redis');
const notionRoutes = require('./routes/notion');
const cacheRoutes = require('./routes/cache');

const app = express();
const redisClient = redis.createClient();

// Middleware
app.use(express.json()); // Pour parser le JSON envoyé dans les requêtes
app.use(cors()); // Permettre les requêtes CORS
app.use(compression()); // Compression des réponses

// Mise en cache HTTP
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    next();
});

// Routes
app.use('/api/notion', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, notionRoutes);
app.use('/api/cache', cacheRoutes); // Utilisez les routes de cache

module.exports = app;