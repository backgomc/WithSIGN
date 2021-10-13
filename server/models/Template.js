const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const templateSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    docTitle: {
        type: String
    },
    docRef: {
        type: String
    },
    type: {
        type: String
    },
    registeredTime: {
        type: Date, default: Date.now
    },
    updatedTime: {
        type: Date
    }
})

const Template = mongoose.model('Template', templateSchema)

module.exports = { Template }