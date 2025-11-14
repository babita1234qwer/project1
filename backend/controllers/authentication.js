const User = require('../models/user');
const validate=require('../utils/validator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const redisclient=require('../config/redis');

const register=async (req, res) => {
    try{
        validate(req.body);
        const{firstName,emailid,password}=req.body;
        req.body.password=await bcrypt.hash(password,10);
        req.body.role="user";
        const user=await User.create(req.body);
        const token= jwt.sign({_id:user._id,emailid:emailid,role:"user"},process.env.JWT_SECRET,{expiresIn:'1h'});
        const reply={
            firstName:user.firstName,
            emailid:user.emailid,
            _id:user._id,
            role:user.role
        }
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(201).json({user:reply,message:'User created successfully',token:token});
       
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err.message});
    }}
const login=async (req, res) => {
    try{
        const {emailid,password}=req.body;
        if(!emailid){
            throw new Error("invalid credential");
        }
        if(!password){
            throw new Error("invalid credential");
        }


        const user=await User.findOne({emailid:emailid});
        const match= await bcrypt.compare(password,user.password);
        if(!match){
            throw new Error("invalid credential");
        }
        const reply={
            firstName:user.firstName,
            emailid:user.emailid,
            _id:user._id,
            role: user.role 
        }
        const token= jwt.sign({_id:user._id,emailid:emailid,role:user.role},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(200).json({ user:reply,message:'User logged in successfully',token:token});
    }
        catch(err){
            console.log(err);
            res.status(401).send({message:err.message});
        }}
const logout=async (req, res) => {
    try{
        
        const {token}=req.cookies;
        if(!token){
            throw new Error("invalid token");
        }
        const payload= jwt.decode(token);
        await redisclient.set(`token:${token}`,"blocked");
        await redisclient.expireAt(`token:${token}`,payload.exp);
        res.cookie('token', null, { expires: new Date(Date.now()) });
        res.send({message:'User logged out successfully'});
        
    }
    catch(err){
    
        console.log(err);
        res.status(503).send({message:err.message});
    }
}

const adminregister=async (req, res) => {
        try{
        validate(req.body);
        const{firstName,emailid,password}=req.body;
        req.body.password=await bcrypt.hash(password,10);
        req.body.role="admin";
        const user=await User.create(req.body);
        const token= jwt.sign({_id:user._id,emailid:emailid,role:"admin"},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(201).send({message:'User created successfully',token:token});
       
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err.message});
    }}

const deleteprofile=async(req, res) => {
    try{
        const userId = req.result._id;
        if(!userId){
            throw new Error("User not found");
        }
        await User.findByIdAndDelete(userId);
   
        res.status(200).send({message:'User profile deleted successfully'});
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err.message});
    }}
module.exports={
    register,
    login,
    logout,
    adminregister
}