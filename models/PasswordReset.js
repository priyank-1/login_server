const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema ({
    userId :  String,
    resetString: String,
    creadtedAt : Date,
    expiresAt : Date
});

const PasswordReset = mongoose.model('PasswordReset',PasswordResetSchema);

module.exports = PasswordReset;