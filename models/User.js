const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    name :  String,
    email : String,
    password : String,
    dateOfBirth : Date,
    verified : Boolean,
    blogs : [{type: mongoose.Types.ObjectId,ref:"Blog",required :true }]
});

const User = mongoose.model('User',UserSchema);

module.exports = User;