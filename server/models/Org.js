const mongoose = require('mongoose');

const orgSchema = mongoose.Schema({
    OFFICE_NAME: {
        type: String
    },
    OFFICE_CODE: {
        type: String
    },
    DEPART_CODE: {
        type: String
    },
    DEPART_NAME: {
        type: String,
        maxlength: 50
    },
    PARENT_NODE_ID: {
        type: String
    },
    DISPLAY_ORDER: {
        type: Number
    }
})

const Org = mongoose.model('Org', orgSchema)

module.exports = { Org }