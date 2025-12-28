import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
    try {
        // const ip = req.ip || req.connection.remoteAddress;
        // const result = await ratelimit.limit(ip);

        const { success } = await ratelimit.limit('my-rate-limit')
        if (!success) {
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        // return res.status(500).json({ message: 'Internal server error', error });
        next(error);
    }
}

export default rateLimiter;