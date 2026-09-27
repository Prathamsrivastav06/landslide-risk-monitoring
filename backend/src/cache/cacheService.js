const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache instances
const stdCache = new NodeCache({ stdTTL: process.env.CACHE_TTL || 1800, checkperiod: 120 });
const terrainCache = new NodeCache({ stdTTL: process.env.TERRAIN_CACHE_TTL || 86400, checkperiod: 3600 });

exports.get = (key, cacheType = 'std') => {
    const cache = cacheType === 'terrain' ? terrainCache : stdCache;
    const value = cache.get(key);
    if (value) {
        logger.debug(`Cache hit for key: ${key}`);
    } else {
        logger.debug(`Cache miss for key: ${key}`);
    }
    return value;
};

exports.set = (key, value, ttl = undefined, cacheType = 'std') => {
    const cache = cacheType === 'terrain' ? terrainCache : stdCache;
    if (ttl) {
        cache.set(key, value, ttl);
    } else {
        cache.set(key, value);
    }
};

exports.del = (key, cacheType = 'std') => {
    const cache = cacheType === 'terrain' ? terrainCache : stdCache;
    cache.del(key);
};

exports.flush = (cacheType = 'std') => {
    const cache = cacheType === 'terrain' ? terrainCache : stdCache;
    cache.flushAll();
};
