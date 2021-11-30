const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { hexCrypto } = require('../common/utils');
const saltRounds = 10
const saltRoundsUid = 5
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    uid : {
        type: String,
        trim: true,
        unique: 1
    },
    name: {
        type: String,
        maxlength: 50,
        alias: 'NM_SAWON'
    },
    email: {
        type: String,
        trim: true,
        // unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: {
        type: String
    },
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    },
    adminJWT: {
        type: String
    },
    DEPART_CODE: {
        type: String,
        alias: 'CODE_BUSEO'
    },
    OFFICE_CODE: {
        type: String
    },
    JOB_CODE: {
        type: String,
        alias: 'CODE_JIKMYUNG'
    },
    JOB_TITLE: {
        type: String,
        alias: 'NM_JIKMYUNG'
    },
    SABUN: {
        type: String,
        alias: 'NO_SAWON'
    },
    use: {
        type: Boolean,
        default: true
    },
    terms: { 
        type: Boolean, 
        default: false
    },
    privacy: { 
        type: Boolean, 
        default: false 
    },
    agreeTime: {
         type: Date 
    },
    paperless: {
        type: Number,
        default: 0
    },
    docCount: {
        type: Number,
        default: 0
    },
})


userSchema.pre('save', function (next) {
    var user = this;
    if (user.isModified('password')) {
        //비밀번호를 암호화 시킨다.
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) return next(err)

            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})

// uid 저장: usrId가 있으면 그대로 사용, 사번이 있으면 사번 암호화해서 사용, 이메일이 있으면 이메일 암호화해서 사용
userSchema.pre('save', function (next) {
    var user = this;

    console.log("A")
    if (user.isModified('SABUN') || user.isModified('email')) {
        console.log("B")
        if (user.uid) {  // ERP에서 받아온 ID가 있으면 해당 ID 사용
            next()
            console.log("C")
        } else if (user.SABUN) {
            // bcrypt.genSalt(saltRoundsUid, function (err, salt) {
            //     if (err) return next(err)
    
            //     bcrypt.hash(user.SABUN, salt, function (err, hash) {
            //         if (err) return next(err)
            //         user.uid = hash
            //         next()
            //     })
            // })
            console.log("D")
            // DB복구를 위해 단순 HASH값으로 변경
            user.uid = hexCrypto(user.SABUN)
            next()
        } else if (user.email) {
            // bcrypt.genSalt(saltRoundsUid, function (err, salt) {
            //     if (err) return next(err)
    
            //     bcrypt.hash(user.email, salt, function (err, hash) {
            //         if (err) return next(err)
            //         user.uid = hash
            //         next()
            //     })
            // })
            console.log("E")
            // DB복구를 위해 단순 HASH값으로 변경
            user.uid = hexCrypto(user.email)
            next()
        }

    } else {
        next()
    }
})

userSchema.methods.comparePassword = function (plainPassword, cb) {

    console.log("plainPassword:"+plainPassword)
    console.log("password:"+this.password)
    //plainPassword 1234567    암호회된 비밀번호 $2b$10$l492vQ0M4s9YUBfwYkkaZOgWHExahjWC
    //plainPassword 22222      암호회된 비밀번호 $2a$10$527Dy8uyL6zW9ZWa/X4o1OjCfgmtLndVi2VIBZsdE/G4yS.ex0k1i
    //plainPassword 22222      암호회된 비밀번호 $2a$10$RPesiN5LTCNul9OpyN50x.qhm9pUSUhX.Dv8Uo8nYXvfnRFqRfNdC
    bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = function (cb) {
    var user = this;
    // console.log('user._id', user._id)

    // jsonwebtoken을 이용해서 token을 생성하기 
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    // user._id + 'secretToken' = token 
    // -> 
    // 'secretToken' -> user._id

    user.token = token
    user.save(function (err, user) {
        if (err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb) {
    var user = this;
    // user._id + ''  = token
    //토큰을 decode 한다. 
    jwt.verify(token, 'secretToken', function (err, decoded) {
        //유저 아이디를 이용해서 유저를 찾은 다음에 
        //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인
        user.findOne({ "_id": decoded, "token": token }, function (err, user) {
            if (err) return cb(err);
            cb(null, user)
        })
    })
}

userSchema.methods.compareUid = function (plainId, cb) {
    // const origin = "sdsdsdsd@gmail.com"
    // const encryped = "$2b$05$AiR.bnrUmsXQvO02x7d6ruXxjbfqhHAeoo1VHM99WfzgPV70Ch2H6"
    // bcrypt.compare(origin, encryped, function (err, isMatch) {
    // bcrypt.compare(plainId, this.uid, function (err, isMatch) {
    //     if (err) return cb(err);
    //     cb(null, isMatch);
    // })

    if (hexCrypto(plainId) === this.uid) {
        cb(null, true) 
    } else {
        cb(null, false)
    }
}

const User = mongoose.model('User', userSchema)

module.exports = { User }