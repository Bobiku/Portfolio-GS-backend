const cache = require('../utils/cache');

exports.clearCache = async (req, res) => {
    try {
        console.log('=== Redis Cache State ===');
        const keys = await cache.keys();
        console.log('Keys before clearing:', keys);
        
        await cache.flushAll();
        
        const keysAfter = await cache.keys();
        console.log('Keys after clearing:', keysAfter);
        console.log('================');
        
        res.status(200).json({ 
            message: 'Redis cache cleared successfully',
            beforeKeys: keys,
            afterKeys: keysAfter
        });
    } catch (error) {
        console.error('Error clearing Redis cache:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
};