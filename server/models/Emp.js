const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    NO_SAWON: {
        type: String
    },
    CODE_SAMUSO: {

    },
    CODE_BUSEO: {
        type: String
    },
    CODE_JIKMYUNG: {
        type: String
    },
    CODE_JIKGEUB: {
        type: String
    },
    NM_SAWON: {
        type: String
    },
    NM_JIKMYUNG: {
        type: String
    },
    NM_JIKGEUB: {
        type: String
    },
    IMG_PROFILE: {
        type: String
    },
    IMG_SIGN: {
        type: String
    }
})

const Emp = mongoose.model('Emp', userSchema)

module.exports = { Emp }