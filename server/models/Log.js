const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String
    },
    url: {
        type: String
    },
    request: {
        type: JSON
    },
    time: {
        type: Date, default: Date.now
    }
})

const Log = mongoose.model('Log', logSchema)

module.exports = { Log }