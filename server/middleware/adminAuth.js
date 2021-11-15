const jwt = require('jsonwebtoken');

// 토큰 생성
function generateToken (user) {
    console.log('generateToken');
    var accessToken  = jwt.sign({_id: user._id.toHexString()}, 'WITHSIGN', {expiresIn: '1m'});
    var refreshToken = jwt.sign({}, 'WITHSIGN', {expiresIn: '10m'});
    return {accessToken, refreshToken}
}

// 토큰 갱신
function renewalToken (req, res, next) {
    console.log('refreshToken');
    var accessToken  = req.cookies.__aToken__;
    var refreshToken = req.headers['refresh-token'];
    jwt.verify(refreshToken, 'WITHSIGN', function (err) {
        if ( err ) return res.json({ success: false, message: err.message });
        jwt.verify(accessToken, 'WITHSIGN', {ignoreExpiration: true}, function (err, payload) {
            if ( err ) return res.json({ success: false, message: err.message });
            req.body._id = payload._id;
            req.body._tk = jwt.sign({_id: payload._id}, 'WITHSIGN', {expiresIn: '1m'});
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
        if ( err ) return res.status(200).json({ success: false, message: err.message });
        req.body._id = payload._id;
        next();
    });
}

module.exports = { generateToken, ValidateToken, renewalToken };