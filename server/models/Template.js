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
    },
    thumbnail: {
        type: String
    },
    orderType: {    // A:동차발송 S:순차발송
        type: String,
        default: "A"
    },
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    usersOrder: [{  // 순차 발송 순서
        user: { type: String },
        order: { type: Number }
    }],
    usersTodo: {    // 순차 발송 : 현재 단계에 서명할 사람 목록 
        type: Array
    },
    observers: {
        type: Array
    },
    signees: [{
        key: { type: String },
        name: { type: String },
        JOB_TITLE: { type: String },
        DEPART_NAME: { type: String },
        order: { type: String }
    }],
    customRef: {
        type: String
    },
    hasRequester: {
        type: Boolean, default: false 
    },
})

// 경로 치환
templateSchema.pre('save', function (next) {
    var templates = this;
    templates.docRef = templates.docRef.replace(/(\\)/g,'/');
    next();
});

const Template = mongoose.model('Template', templateSchema)

module.exports = { Template }