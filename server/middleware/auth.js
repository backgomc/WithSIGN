const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

let auth = (req, res, next) => {
    //인증 처리를 하는곳 
    //클라이언트 쿠키에서 토큰을 가져온다.

    let token = req.cookies.x_auth;
    // 토큰을 복호화 한후  유저를 찾는다.
    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.json({ isAuth: false, error: true })


        // console.log('userh', user)

        req.token = token;
        req.user = user;
        next();
    })
}

// 토큰 생성
function generateToken (user) {
    console.log('generateToken');
    var accessToken  = jwt.sign({_id: user._id.toHexString()}, 'WITHSIGN', {expiresIn: '60m'});
    var refreshToken = jwt.sign({}, 'WITHSIGN', {expiresIn: '720m'});
    return {accessToken, refreshToken}
}

// 토큰 갱신
function renewalToken (req, res, next) {
    console.log('renewalToken called');
    var accessToken  = req.cookies.__aToken__;
    var refreshToken = req.headers['refresh-token'];
    jwt.verify(refreshToken, 'WITHSIGN', function (err) {
        if (err) return res.json({ success: false, message: err.message, isAuth: false });
        jwt.verify(accessToken, 'WITHSIGN', {ignoreExpiration: true}, function (err, payload) {
            if (err) return res.json({ success: false, message: err.message, isAuth: false });
            req.body.systemId = payload._id;
            req.body.accessTk = jwt.sign({_id: payload._id}, 'WITHSIGN', {expiresIn: '60m'});
            console.log('OK');
            next();
        });
    });
}

// 토큰 검증
function ValidateToken (req, res, next) {
    console.log('__aToken__ : ' + req.cookies.__aToken__);
    var token = req.cookies.__aToken__;
    jwt.verify(token, 'WITHSIGN', function (err, payload) {
        if (err) return res.status(200).json({ success: false, message: err.message, isAuth: false });
        req.body.systemId = payload._id;
        next();
    });
}

module.exports = { auth, generateToken, ValidateToken, renewalToken };