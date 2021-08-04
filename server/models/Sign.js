const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const signSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    signData: {
        type: String
    },
    registeredTime: {
        type: Date, default: Date.now
    }
})

const Sign = mongoose.model('Sign', signSchema)

module.exports = { Sign }