const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = mongoose.Schema({
    user: {
        // type: String,
        // maxlength: 50
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    email: {
        type: String,
        trim: true    
    },
    docTitle: {
        type: String
    },
    docRef: {
        type: String
    },
    users: { type: Array },
    // emails: { type: Array },
    xfdf: {
        type: Array
    },
    signedBy: {
        type: Array
    },
    signed: {
        type: Boolean
    },
    requestedTime: {
        type: Date, default: Date.now
    },
    signedTime: {
        type: Date
    }
})

const Document = mongoose.model('Document', documentSchema)

module.exports = { Document }