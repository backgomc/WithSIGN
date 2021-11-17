const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = mongoose.Schema({
    user: {
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
    docType: {  // G:일반서명 B:대량서명
        type: String,
        default: "G"
    },
    docHash: {
        type: String
    },
    // users: { type: Array },  //ISSUE: 아래 걸로 하면 리스트 하나를 못가지고 옴 
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    // emails: { type: Array },
    xfdf: {
        type: Array
    },
    signedBy: [{
        user: { type: String },
        signedTime: { type: Date },
        ip: {type: String }
    }],
    // signedBy: {
    //     type: Array
    // },
    canceledBy: [{
        user: { type: String },
        canceledTime: { type: Date },
        message: { type: String }
    }],
    canceled: {
        type: Boolean, default: false 
    },
    signed: {
        type: Boolean
    },
    requestedTime: {
        type: Date, default: Date.now
    },
    signedTime: {
        type: Date
    },
    thumbnail: {
        type: String
    }
})

const Document = mongoose.model('Document', documentSchema)

module.exports = { Document }