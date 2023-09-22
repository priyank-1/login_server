const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title: {
        type : String,
        required : true,
    },
     description:{
        type : String,
        required : true,
     },
     image:{
        type: String,
        required : true,
     },
     user:{
        type: mongoose.Types.ObjectId,
        ref:"User",
        required : true,
     },
     likes:[{type : ObjectId,ref:"User"}],
     comments:[{
      text : String,
      postedBy : {type : ObjectId , ref : "User"}
     }]
}); 

const blog= mongoose.model("Blog",blogSchema);
module.exports = blog;