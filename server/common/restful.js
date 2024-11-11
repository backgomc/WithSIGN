const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const iconv = require('iconv-lite');
const bcrypt = require('bcryptjs');
const config = require('../config/key');
const { hexCrypto, makeFolder, generateRandomName } = require('../common/utils');
const { Emp } = require('../models/Emp');
const { Org } = require('../models/Org');
const { User } = require('../models/User');
const { Document } = require('../models/Document');
const { pipe, gotenberg, convert, office, to, landscape, set, filename, please, ping, html, adjust } = require('gotenberg-js-client'); 

const toPDF = pipe(
    gotenberg(''),
    convert,
    office,
    // to(landscape),
    set(filename('result.pdf')),
    adjust({
      // manually adjust endpoint
      url: config.gotenbergURI + '/forms/libreoffice/convert'
    }),
    please
);

const saltRounds = 10;
const titleHeader = '[WithSIGN] ';

// ERP 부서 동기화
let callOrgAPI = async () => {
    console.log('ERP ORG CALL');
    try {
        let url = config.erpURI+'/nhipierp/if/16/hr/elecsign_s01.jsp';
        let response = await axios.get(url, {responseType: 'arraybuffer', responseEncoding: 'binary'});
        if ( response.status == 200 ) {
            let contents = JSON.parse(iconv.decode(response.data, 'EUC-KR').toString());
            let orgList = contents.orgList;
          
            // 1. ORG DELETE
            let result  = await Org.deleteMany({});
            console.log(result);
          
            // 2. ORG INSERT MANY
            result = await Org.insertMany(orgList);
            console.log('ORG INSERT ' + result.length + ' 건');
        } else {
             // error
        }
        return response;
    } catch (err) {
        console.error(err);
        return err;
    }
}

// ERP 직원 동기화
let callUserAPI = async () => {
    console.log('ERP USER CALL');
    try {
        let url = config.erpURI+'/nhipierp/if/16/hr/elecsign_s02.jsp';
        let response = await axios.get(url, {responseType: 'arraybuffer', responseEncoding: 'binary'});
        if ( response.status == 200 ) {
            let contents = JSON.parse(iconv.decode(response.data, 'EUC-KR').toString());
            let userList = contents.userList;
          
            // 1. EMP DELETE
            let result = await Emp.deleteMany({});
            console.log(result);
          
            // 2. EMP INSERT MANY
            result = await Emp.insertMany(userList);
            console.log('ERP INSERT ' + result.length + ' 건');
            
            // 3. 입사 처리(신규) >>> ERP 재직자 목록 - 서명시스템 사용자 목록 = 입사
            let usrList = [];
            result = await User.find({}, {'SABUN': 1, '_id': 0});
            result.forEach(data => {
                usrList.push(data.SABUN);
            });
            result = await Emp.find({'NO_SAWON': {$nin: usrList} });
            let newList = [];
            let newUser = {};
            let saltRnd = await bcrypt.genSalt(saltRounds);
            for (var data of result) {
                newUser = new User();
                newUser['name'] = data['NM_SAWON'];
                newUser['uid'] = hexCrypto(data['NO_SAWON']);
                newUser['password'] = await bcrypt.hash(data['NO_SAWON'], saltRnd);
                newUser['SABUN'] = data['NO_SAWON'];
                newUser['OFFICE_CODE'] = data['CODE_SAMUSO'];
                newUser['DEPART_CODE'] = data['CODE_BUSEO'];
                newUser['JOB_CODE'] = data['CODE_JIKMYUNG'];
                newUser['JOB_TITLE'] = data['NM_JIKMYUNG'];
                if (data['IMG_PROFILE'] !== '') {
                    await axios.get(data['IMG_PROFILE'], {responseType: 'arraybuffer'}).then(resp => {
                        // newUser['thumbnail'] = 'data:image/jpeg;base64,' + Buffer.from(resp.data).toString('base64');
                        let filePath = config.storageDIR + config.profileDIR;
                        let fileName = generateRandomName() + '.png';
                        newUser['thumbnail'] = filePath + fileName;
                        makeFolder(filePath);
                        fs.writeFile(filePath + fileName, resp.data, function(err) {
                            if (err) console.log(err);
                        });
                    });
                }
                newList.push(newUser);
            }
            result = await User.insertMany(newList);
            console.log('입사자 ' + result.length + ' 건');

            // 4. 퇴사 처리(변경) >>> 서명시스템 사용자 목록 - ERP 재직자 목록 = 퇴사
            let empList = [];
            result = await Emp.find({}, {'NO_SAWON': 1, '_id': 0});
            result.forEach(data => {
                empList.push(data['NO_SAWON']);
            });
            result = await User.find({'SABUN': {$nin: empList} }).updateMany({}, {'use': false});
            console.log(result);

            // 5. 승진/이동(부서 및 직명 변경)
            result = await User.aggregate([
                {
                    $lookup: {
                        from: 'emps',
                        localField: 'SABUN',
                        foreignField: 'NO_SAWON',
                        as: 'empInfo'
                    }
                }
            ]);
            for (var data of result) {
                if (data['use'] && data['empInfo'].length > 0) {
                    if (data['DEPART_CODE'] !== data['empInfo'][0]['CODE_BUSEO'] || data['JOB_CODE'] !== data['empInfo'][0]['CODE_JIKMYUNG'] || !data['thumbnail'] || data['thumbnail'] == '') {
                        let thumbnail = '';
                        if (data['empInfo'][0]['IMG_PROFILE'] !== '') {
                            await axios.get(data['empInfo'][0]['IMG_PROFILE'], {responseType: 'arraybuffer'}).then(resp => {
                                // thumbnail = 'data:image/jpeg;base64,' + Buffer.from(resp.data).toString('base64');
                                let filePath = config.storageDIR + config.profileDIR;
                                let fileName = generateRandomName() + '.png';
                                thumbnail = filePath + fileName;
                                makeFolder(filePath);
                                fs.writeFile(filePath + fileName, resp.data, function(err) {
                                    if (err) console.log(err);
                                });
                            });
                        }
                        User.findOneAndUpdate(
                            {'_id': data['_id']},
                            {'DEPART_CODE': data['empInfo'][0]['CODE_BUSEO'], 'JOB_CODE': data['empInfo'][0]['CODE_JIKMYUNG'], 'JOB_TITLE': data['empInfo'][0]['NM_JIKMYUNG'], 'thumbnail': thumbnail}
                        ).exec((err) => {
                            if (err) console.log(err);
                            console.log('승진/이동 : ' + data['SABUN']);
                        });
                    }
                }
            }
            
            // 6. 인장 파일 저장(보류)

        } else {
            // error
        }
        return response;
    } catch (err) {
        console.error(err);
        return err;
    }
}

// DRM 문서 암호화
let callDRMPackaging = async (filePath, fileName, target) => {
    console.log('origin : ' + filePath + fileName);
    console.log('target : ' + target);

    try {
        let url = config.drmURI+'/drm/packaging';
        let body = {
            filePath: './' + filePath,
            fileName: fileName,
            target: (target)?'./'+target:target
        }
        return await axios.post(url, body);
    } catch (err) {
        console.error(err);
    }
}

// DRM 문서 복호화
let callDRMUnpackaging = async (filePath, fileName, target) => {
    console.log('origin : ' + filePath + fileName);
    console.log('target : ' + target);

    try {
        let url = config.drmURI+'/drm/unpackaging';
        let body = {
            filePath: './' + filePath,
            fileName: fileName,
            target: (target)?'./'+target:target
        }
        return await axios.post(url, body);
    } catch (err) {
        console.error(err);
    }
}

// 통합 알림
// sendInfo : String _id (Option)
// recvInfo : Arrays _id;_id ... ;_id
let callNotify = async (send, recv, title, message, filePath, docId) => {
    let sendData = await User.findOne({_id: send}, {'SABUN': 1, '_id': 0});
    let recvData = await User.find({_id: recv}, {'SABUN': 1, '_id': 0});
    let sendInfo;
    if (sendData) {
        sendInfo = sendData['SABUN'];
    }
    let recvInfo = [];
    let IproRecvInfo = [];
    let linkRecvInfo = [];
    //let tester = ['P0610003', 'P0810080', 'P1010008', 'P1110051', 'P1810053', 'P1210044', 'P2010063', 'P2210044' ]; //빅데이터팀
    let withLink = ''
    
    if(docId) {
        withLink = message + '<br/><a href = "' + config.withsignMobileURI + '/@infog&docId=' + docId + '">WithSIGN 서명 바로가기</a>';
        console.log('callNotify - docId [' + docId + '] - withLink [' + withLink + ']')
    }
    
    for (var data of recvData) {
        if(docId){
        //if(docId && tester.includes(data['SABUN'])){
            linkRecvInfo.push(data['SABUN']);
        } else {
            recvInfo.push(data['SABUN']);
        }
        IproRecvInfo.push(data['SABUN']);
    }
    console.log('callNotify - linkRecvInfo : ' + linkRecvInfo)
    console.log('callNotify - recvInfo : ' + recvInfo)
    
    if(recvInfo.length > 0) callNHWithPUSH(sendInfo, recvInfo, title, message);
    if(IproRecvInfo.length > 0) callIpronetMSG(sendInfo, IproRecvInfo, title, message, filePath);
    
    if(docId && linkRecvInfo.length > 0){
        callNHWithPUSH(sendInfo, linkRecvInfo, title, withLink);
    }
}

// Ipronet 쪽지 발송
// sendInfo : String SABUN (Option)
// recvInfo : Arrays SABUN;SABUN ... ;SABUN
let callIpronetMSG = async (sendInfo, recvInfo, title, message, filePath) => {
    console.log('IPRONET SEND MESSAGE');
    if (!sendInfo) sendInfo = config.ipronetID;
    try {
        // 1. 로그인 세션
        let url = config.ipronetURI+'/index.jsp?loginid='+config.ipronetID+'&loginpw='+config.ipronetPW;
        let body = {}
        let conf = {}
        let resp = await axios.get(url, body);
        let cookie = resp.headers['set-cookie'];
        // console.log(cookies);

        // 2. 송신자 아이프로넷 계정정보 조회
        url = config.ipronetURI+'/jsl/EmployeeSelector.SelectUsersBySabuns.json';
        conf = {headers: {'Cookie': cookie, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*'}}
        let sendObj = await axios.post(url, 'sabuns='+sendInfo, conf);
        // console.log(sendObj);

        // 3. 수신자 아이프로넷 계정정보 조회
        url = config.ipronetURI+'/jsl/EmployeeSelector.SelectUsersBySabuns.json';
        conf = {headers: {'Cookie': cookie, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*'}}
        let recvObj = await axios.post(url, ('sabuns='+recvInfo).replace(/,/g,';'), conf);
        // console.log(recvObj);

        // 4. 메시지 전송
        url = config.ipronetURI+'/jsl/NHITMessageAction.Send.jsl';
        let fileInfo = []
        let fileData;
        let fileName;
        let copyPath;
        if (filePath) {
            if (fs.existsSync(filePath)) {
                fileName = filePath.substring(filePath.lastIndexOf('/')+1, filePath.length);
                copyPath = config.storageDIR + 'temp/' + fileName;
                await callDRMPackaging(filePath.substring(0,filePath.lastIndexOf('/')+1), fileName, copyPath);
                fileData = fs.readFileSync(copyPath, {filename: fileName});
                fileInfo = [{
                    method: 'copy',
                    type: 1,
                    path: 'com.kcube.jsv.file.1',
                    size: fileData.length,
                    filename: fileName
                }]
            }
        }
        body = {
            sender: sendObj.data['array'][0],
            receivers: recvObj.data['array'],
            title: titleHeader + title,
            content: message + '<br/><br/><br/><a href="' + config.withsignURI + '/" target="_blank">WithSIGN 바로가기</a>',
            attachments:fileInfo,
            push:false
        }
        let form = new FormData();
        form.append('message', JSON.stringify(body));
        if (fileData) form.append('com.kcube.jsv.file.1', fileData, {filename: fileName});
        conf = {headers: {'Cookie': cookie, ...form.getHeaders()}}
        resp = await axios.post(url, form, conf);
        console.log(resp);
    } catch (err) {
        console.error(err);
    }
}

// With Push 발송
// sendInfo : String SABUN (Option)
// recvInfo : Arrays SABUN;SABUN ... ;SABUN
let callNHWithPUSH = async (sendInfo, recvInfo, title, message) => {
    console.log('NHWITH SEND PUSH');
    if (!sendInfo) sendInfo = config.nhwithSNDR;
    try {
        url = config.nhwithURI+'/api/message';
        conf = {headers: {'Content-Type': 'application/json'}}
        body = {
            sourceInfo: config.nhwithID,
            sourcePassword: config.nhwithPW,
            title: titleHeader + title,
            content: message,
            senderId: sendInfo,
            receivers: recvInfo
        }
        resp = await axios.post(url, JSON.stringify(body), conf);
        // console.log(resp);
    } catch (err) {
        console.error(err);
    }
}

// 블록체인 해시값 저장
// docHash : String 
let callSaveDocHash = async (docId, docHash) => {
    console.log('NHWITH SEND PUSH');
    if (!docHash) return;
    try {
        let url = config.blockURI+'/block/saveDocHash';
        let conf = {headers: {'Content-Type': 'application/json'}}
        let body = {
            docHash: docHash
        }
        let res = await axios.post(url, JSON.stringify(body), conf);
        console.log(res);

        if(res.data.success) {
            await Document.updateOne({ _id: docId }, {transactionHash: res.data.result.transactionHash});
        }

    } catch (err) {
        console.error(err);
    }
}

// OFFICE 문서 PDF 변환
// filepath : String 
// filename : String 
let convertOfficeToPDF = async (filepath, filename) => {

    try {
        // const destination = 'storage/temp';
        // const filename = 'kk.xls';
      
        const inputPath = `${filepath}/${filename}`;
        const outputPath = `${filepath}/${filename.split('.')[0]}.pdf`;
    
        if (fs.existsSync(inputPath)) { // 비동기 메서드는 try/catch 안먹히므로 파일 선체크 로직 추가
    
          const pdf = await toPDF(`file://${inputPath}`)
          pdf.pipe(fs.createWriteStream(outputPath))
    
          return { success: true, inputPath: inputPath, outputPath: outputPath };
    
        } else {
            return { success: false, message: 'file not existed!' };
        }
    
      } catch (error) {
        console.log(error);
        return { success: false, message: error };
      }
}

// With 사번 요청
// userId : String encode 사번
let callNHWithAuth = async (userId) => {
    console.log('NHWITH Auth call start');

    try {
        url = config.nhwithURI+'/user/sabun'
        body = {
            userIds : [userId],
            key : "nhisNHWith"
        }
        conf = {headers: {'Content-Type': 'application/json'}, timeout : 5000}
        
        return await axios.post(url, JSON.stringify(body), conf )
    } catch (err) {
        console.error(err);
        return null
    }
}

module.exports = {callOrgAPI, callUserAPI, callDRMPackaging, callDRMUnpackaging, callNotify, callIpronetMSG, callNHWithPUSH, callSaveDocHash, convertOfficeToPDF, callNHWithAuth}
