const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    linkTitle: {
        type: String,
        required: true
    },
    docTitle: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    accessPassword: {
        type: String,
        required: true
    },
    passwordHint: {
        type: String
    },
    expiryDays: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    approver: {
        type: String
    },
    items: [{
        type: Schema.Types.Mixed
    }],
    // PDF 파일 경로
    docRef: {
        type: String
    },    
    isActive: {
        type: Boolean,
        required: true
    },
    externalEmails: [{
        email: { type: String },
        name: { type: String },
        phone: { type: String }
    }],
    docs: [{
        type: Schema.Types.ObjectId,
        ref: 'Document'
    }],
    linkUrl: {
        type: String
    },
    deleted: {
        type: Boolean
    },
    requestedTime: {
        type: Date, 
        default: Date.now
    },
    deletedBy: [{
        user: { type: String },
        deletedTime: { type: Date }
    }],
    statusUpdatedBy: {
        type: String
    },
    statusUpdatedTime: {
        type: Date
    }
})

const Link = mongoose.model('Link', linkSchema)

module.exports = { Link }