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
    ip: {   // 서명요청자 ip 정보
        type: String
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
    orderType: {  // A:동차발송 S:순차발송
        type: String,
        default: "A"
    },
    docHash: {
        type: String
    },
    transactionHash: {
        type: String
    },
    // users: { type: Array },  //ISSUE: 아래 걸로 하면 리스트 하나를 못가지고 옴 
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    usersOrder: [{  // 순차 발송 순서
        user: { type: String },
        order: { type: Number },
        allowSkip: {type: Boolean, default: false}
    }],
    usersTodo: { // 순차 발송 : 현재 단계에 서명할 사람 목록 
        type: Array
    },
    // emails: { type: Array },
    xfdf: {
        type: Array
    },
    signedBy: [{
        user: { type: String },
        signedTime: { type: Date },
        ip: {type: String },
        skipped: {type: Boolean, default: false}
    }],
    signed: {
        type: Boolean
    },
    canceledBy: [{
        user: { type: String },
        canceledTime: { type: Date },
        message: { type: String }
    }],
    canceled: {
        type: Boolean, default: false 
    },
    deletedBy : [{
        user: { type: String },
        deletedTime: { type: Date }
    }],
    deleted: {
        type: Boolean, default: false
    },
    requestedTime: {
        type: Date, default: Date.now
    },
    signedTime: {
        type: Date
    },
    recentTime: {   //최근 활동 시간
        type: Date, default: Date.now
    },
    thumbnail: {
        type: String
    },
    pageCount: {
        type: Number,
        default: 1
    },
    observers: {
        type: Array
    },
    attachFiles: {
        type: Array
    },
    folders: [{
        type: Schema.Types.ObjectId,
        ref: 'Folder'
    }],
    downloads: {
        type: Array
    },
    items: {
        type: Array
    },
    isWithPDF: {
        type: Boolean, default: false 
    }
})

// 경로 치환
documentSchema.pre('save', function (next) {
    var document = this;
    document.docRef = document.docRef.replace(/(\\)/g,'/');
    next();
});

const Document = mongoose.model('Document', documentSchema)

module.exports = { Document }