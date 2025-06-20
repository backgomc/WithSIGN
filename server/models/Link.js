const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    linkTitle: {
        type: String
    },
    description: {
        type: String
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
    expiryDate: {
        type: Date
    },
    requireAuth: {
        type: Boolean,
        default: true
    },
    authMethod: {
        type: String,
        enum: ['email', 'sms', 'both'],
        default: 'email'
    },
    allowDownload: {
        type: Boolean,
        default: false
    },
    canceled: {
        type: Boolean,
        default: false
    },
    signed: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    requestedTime: {
        type: Date, 
        default: Date.now
    },
    completedTime: {
        type: Date
    },
    canceledBy: [{
        user: { type: String },
        canceledTime: { type: Date },
        message: { type: String }
    }],
    deletedBy: [{
        user: { type: String },
        deletedTime: { type: Date }
    }]
})

const Link = mongoose.model('Link', linkSchema)

module.exports = { Link }