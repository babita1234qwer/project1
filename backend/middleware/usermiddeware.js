const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisclient = require("../config/redis");
const mongoose = require('mongoose');
require('dotenv').config();

// prefer env secret, fallback to the old value for backwards compatibility
const JWT_SECRET = process.env.JWT_SECRET || "01b0142fc8369a6b8046bc0f6fbbda6b910b173fa0b5ae6af833cb48107a5892";

const userMiddleware = async (req, res, next) => {
    try{
       
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected (readyState=', mongoose.connection.readyState, ')');
            return res.status(503).json({ message: 'Service unavailable: database not connected' });
        }


        const cookieToken = req.cookies?.token;
        const headerAuth = req.headers?.authorization;
        const headerToken = typeof headerAuth === 'string' && headerAuth.split(' ')[1];
        const token = cookieToken || headerToken;

        if (!token) {
            console.warn('No auth token provided on request', { path: req.path, method: req.method });
            return res.status(401).json({ message: 'No token provided' });
        }

      
        const tokenSource = cookieToken ? 'cookie' : (headerToken ? 'authorization header' : 'unknown');
        console.log(`Auth token found in: ${tokenSource} for path ${req.path}`);

        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.warn('JWT verify failed:', err.message);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const { _id } = payload || {};
        if (!_id) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        const result = await User.findById(_id);
        if (!result) {
            return res.status(401).json({ message: "User not found" });
        }

        const isblocked = await redisclient.exists(`token:${token}`);
        if (isblocked) {
            return res.status(403).json({ message: 'User is blocked' });
        }

        req.user = result;
        next();

    }
    catch(err){
        console.error('userMiddleware error:', err);
        res.status(500).send({message:'Authentication middleware error'});
    }}

module.exports=userMiddleware;