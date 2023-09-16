const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserVerificationSchema = new Schema ({
    userId :  String,
    uniqueString: String,
    creadtedAt : Date,
    expiresAt : Date
});

const UserVerification = mongoose.model('UserVerification',UserVerificationSchema);

module.exports = UserVerification;