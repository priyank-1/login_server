const express = require('express');
const {getAllBlogs,addBlog,updateBlog,getById,deleteBlog, getByUserId,like,comments} = require('../api/blog-controller');

// import { getAllBlogs } from "../api/blog-controller";

const blogRouter =express.Router();




blogRouter.get("/",getAllBlogs);
blogRouter.post("/add",addBlog);
blogRouter.put("/update/:id",updateBlog);
blogRouter.get("/:id",getById);
blogRouter.delete("/:id",deleteBlog);
blogRouter.put("/:id/like",like);
blogRouter.put("/:id/comment",comments);
blogRouter.get('/user/:id',getByUserId);

module.exports = blogRouter