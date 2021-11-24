
const crypto = require('crypto');
const fs = require('fs');

const ENCRYPTION_KEY = 'nacf1234'
const IV_LENGTH = 16;
const algorithm = 'aes-256-ctr';

const hexCrypto = value => {
    return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Encrypt text with a given secret
 * 
 * @param text text to encrypt
 * @returns encrypted data
 */
function encrypt(text) {
    
    const key = crypto
        .createHash('sha256')
        .update(ENCRYPTION_KEY)
        .digest('base64')
        .substr(0, 32);

	let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt an data if the scret is the right one
 * 
 * @param text encrypted data
 * @returns decrypted data
 */
function decrypt(text) {

    const key = crypto
        .createHash('sha256')
        .update(ENCRYPTION_KEY)
        .digest('base64')
        .substr(0, 32);

	let textParts = text.split(':');
	let iv = Buffer.from(textParts.shift(), 'hex');
	let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);

	return decrypted.toString();
}

const generateRandomName = () => {
    let n = 10  //10 자리
    let str = ''
    for (let i = 0; i < n; i++) {
      str += Math.floor(Math.random() * 10)
    }
    return str
}

const makeFolder = (dir) => {
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const today = () => {
    var today = new Date();
    var year = today.getFullYear();
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var day = ('0' + today.getDate()).slice(-2);
    var dateString = year + month  + day;

    console.log(dateString);
    return dateString;
}



module.exports = { hexCrypto, encrypt, decrypt, generateRandomName, makeFolder, today };