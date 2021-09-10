const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bulkSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    docTitle: {
        type: String
    },
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    docs: [{
        type: Schema.Types.ObjectId,
        ref: 'Document'
    }],
    canceled: {
        type: Boolean 
    },
    signed: {
        type: Boolean
    },
    requestedTime: {
        type: Date, default: Date.now
    }
})

const Bulk = mongoose.model('Bulk', bulkSchema)

module.exports = { Bulk }