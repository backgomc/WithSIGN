const mongoose = require('mongoose');

const orgSchema = mongoose.Schema({
    OFFICE_NAME: {
        type: String,
        alias: 'NM_SAMUSO'
    },
    OFFICE_CODE: {
        type: String,
        alias: 'CODE_SAMUSO'
    },
    DEPART_CODE: {
        type: String,
        alias: 'CODE_BUSEO'
    },
    DEPART_NAME: {
        type: String,
        maxlength: 50,
        alias: 'NM_BUSEO'
    },
    PARENT_NODE_ID: {
        type: String,
        alias: 'CODE_BUSEO_HIGH'
    },
    DISPLAY_ORDER: {
        type: Number,
        alias: 'NO_SORT'
    }
})

const Org = mongoose.model('Org', orgSchema)

module.exports = { Org }