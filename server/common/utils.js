
const crypto = require('crypto');

const hexCrypto = value => {
    return crypto.createHash('sha256').update(value).digest('hex')
}

module.exports = { hexCrypto };