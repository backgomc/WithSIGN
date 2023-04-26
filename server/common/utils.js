
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

const generateRandomPass = (size, type) => {
    let num = "0123456789";
    let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lower = "abcdefghijklmnopqrstuvwxyz";
    let chr;
    switch (type) {
        case 'onlyNum':
            chr = num;
            break;
        case 'complex':
            chr = num + upper + lower;
            break;
        default:
            chr = num + lower;
            break;
    }
    let len = size ? size : 8;  // Default : 8자리
    var rnd = '';
    for (let i = 0; i < len; i++) {
        let num = Math.floor(Math.random() * chr.length);
        rnd += chr.substring(num, num + 1);
    }
    return rnd;
}

const makeFolder = (dir) => {
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const deleteFolder = (dir) => {
    console.log('deleteFolder called', dir);
    try {
        if(fs.existsSync(dir)) {
            // delete directory recursively
            fs.rm(dir, { recursive: true, force: true }, err => {
                if (err) {
                    throw err
                }
                console.log(`${dir} is deleted!`)
            })        
        }
    } catch (err) {
        console.error(err)
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

var isEmpty = function(value){ if( value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys(value).length ) ){ return true }else{ return false } };


/**
 * 배열안에 원본 파일명과 동일한 파일이 존재하는 경우 파일명 뒤에 숫자를 붙여 리턴해준다.
 * 
 * @param fileName 원본 파일 이름
 * @param filesInDirectory 파일 목록
 * @returns 변경된 파일 이름 
 */
const getUniqueFileName = (fileName, filesInDirectory) => {
    let uniqueFileName = fileName;
    let fileExtension = '';
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      fileExtension = fileName.substring(lastDotIndex);
      uniqueFileName = fileName.substring(0, lastDotIndex);
    }
    let counter = 1;
    while (filesInDirectory.includes(uniqueFileName + fileExtension)) {
      uniqueFileName = fileName.substring(0, lastDotIndex) + `(${counter++})`;
    }
    return uniqueFileName + fileExtension;
}


module.exports = { hexCrypto, encrypt, decrypt, generateRandomName, generateRandomPass, makeFolder, today, isEmpty, getUniqueFileName, deleteFolder };