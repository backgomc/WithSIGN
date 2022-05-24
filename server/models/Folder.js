const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const folderSchema = mongoose.Schema({
    user: {             // 생성자
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    folderName: {       // 폴더명
        type: String
    },
    docs: [{            // 파일 목록
        document: { type: Schema.Types.ObjectId, ref: 'Document'},
        alias: { type: String }
    }],
    shared: {           // 공유 유무
        type: Boolean, default: false 
    },
    sharedTarget: [{   // 공유 대상 - 부서코드 또는 사번
        target: { type: String },
        editable: { type: Boolean, default: false }
    }]
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = { Folder }