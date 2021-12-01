const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boardSchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    boardType: {
        type: String
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    registeredTime: {
        type: Date, default: Date.now
    },
    updatedTime: {
        type: Date
    },
    comments: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        registeredTime: {  type: Date, default: Date.now },
        content: { type: String }
    }],

})

const Board = mongoose.model('Board', boardSchema)

module.exports = { Board }