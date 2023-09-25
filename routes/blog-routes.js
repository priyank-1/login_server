const express = require('express');
const {getAllBlogs,addBlog,updateBlog,getById,deleteBlog, getByUserId,like,comments} = require('../api/blog-controller');

// import { getAllBlogs } from "../api/blog-controller";

const blogRouter =express.Router();


const jwt = require('jsonwebtoken');
 // Replace with your actual secret key

 const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1];
  
      jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
          
          console.log(err); // Add this line for debugging
          return res.status(403).json({ message: 'Token is not valid' });
        }
  
        // Token is valid, attach user information to the request object
        req.user = user;
        next();
      });
    } else {
      // No token provided
      console.log('No token provided'); // Add this line for debugging
      return res.status(401).json({ message: 'You are not authenticated' });
    }
  };
  

blogRouter.use(verifyToken);

blogRouter.get("/",getAllBlogs);
blogRouter.post("/add",addBlog);
blogRouter.put("/update/:id",updateBlog);
blogRouter.get("/:id",getById);
blogRouter.delete("/:id",deleteBlog);
blogRouter.put("/:id/like",like);
blogRouter.put("/:id/comment",comments);
blogRouter.get('/user/:id',getByUserId);

module.exports = blogRouter