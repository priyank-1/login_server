// import Blog from "../models/Blog";
const { mongo, default: mongoose } = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');


const getAllBlogs = async(req,res,next) =>{
    let blogs;
    try{
        blogs = await Blog.find();
    }
    catch(err){
        return console.log(err);
    }
    if(!blogs){
        return res.status(404).json({message:"No Blogs Found"});
    }

    return res.status(200).json({blogs});
}


const addBlog = async (req,res,next)=>{
    const {title,description,image,user} = req.body;

    let existinguser ;
    try{
     existinguser = await User.findById(user);
    }
    catch(err){
      return console.log(err);
    }
    if(!existinguser){
        return  res.status(400).json({message:"Unable to find User by this id "});
     }

    const blog = new Blog({
        title,description,image,user,
    });
    try{
       const session = await mongoose.startSession();
       session.startTransaction();
       await blog.save({session});
       existinguser.blogs.push(blog);
       await existinguser.save({session});
       await session.commitTransaction();

    }catch(err){
        return res.status(500).json({message:err});
    }
    return res.status(200).json({blog});
}

const updateBlog = async(req,res,next) => {
    const {title,description} = req.body;
    const blogId = req.params.id;
    let blog;
    try{
        blog = await Blog.findByIdAndUpdate(blogId,{
            title,
            description
         })
    } catch(err){
        return console.log(err);
    }
    if(!blog){
        return res.status(500).json({message:"Unable To Update The Blog"});
    }

    return res.status(200).json({blog});
};

const getById = async (req,res,next)=>{
    const bid = req.params.id;
    let blog;
    try{
        blog = await Blog.findById(bid);
    } 
    catch(err)
    {
        return console.log(err);
    }
    if(!blog){
        return res.status(404).json({message:"No Blog Found"});
    }

    return res.status(200).json({blog});
}

const deleteBlog= async (req,res,next)=>{

    const id = req.params.id;
    let blog;
    try{
        blog = await Blog.findByIdAndRemove(id).populate('user');
        await blog.user.blogs.pull(blog);
        await blog.user.save();
    }catch(err){
        console.log(err)
    }
    if(!blog){
        return res.status(500).json({message:"uanble to delete"});
    }

    return res.status(200).json({message:"Deleted Blog Successfully"});

}

const getByUserId =  async(req,res,next) =>{
    const userId = req.params.id;
    let userBlogs;
    try{
        userBlogs = await User.findById(userId).populate("blogs");
    }catch(err){
        return console.log(err);
    }
    if(!userBlogs){
        return res.status(404).json({message:"No Blog Found"});
    }

    return res.status(200).json({blogs:userBlogs});
}

const like =  async(req,res,next)=>{
    const id = req.params.id;
    try{
    const blog = await Blog.findByIdAndUpdate(id); 
    if(!blog.likes.includes(req.body.user)){
        await blog.updateOne({"$push":{"likes":req.body.user}});
        res.status(200).json({message:"Post Liked"});
    }
    else{
        await blog.updateOne({$pull:{likes:req.body.user}});
        res.status(200).json({message:"Post DisLiked"});
    }
}catch(err){
    return res.status(500).json(err);
}
}


const comments =  async(req,res,next)=>{
     const comment = {
        text : req.body.text,
        postedBy : req.body.user
     }
    const id = req.params.id;
    try{
    const blog = await Blog.findByIdAndUpdate(id); 
    if(!blog.comments.includes(req.body.user)){
        await blog.updateOne({"$push":{"comments":comment}});
        res.status(200).json({message:"Commented on Post"});
    }
    else{
        await blog.updateOne({$pull:{comments:req.body.user}});
        res.status(200).json({message:"Comments Deleted"});
    }
}catch(err){
    return res.status(500).json(err);
}
}

module.exports = {getAllBlogs,addBlog,updateBlog,getById,deleteBlog,getByUserId,like,comments};


