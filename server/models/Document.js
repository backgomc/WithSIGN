const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
    uid: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true    
    },
    docRef: {
        type: String
    },
    // emails: [{
    //     email : String,
    //     _id : String
    // }], 
    emails: { type: Array },
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