const axios = require('axios');
const iconv = require('iconv-lite');
const bcrypt = require('bcryptjs');
const config = require('../config/key');
const { hexCrypto } = require('../common/utils');
const { Emp } = require('../models/Emp');
const { Org } = require('../models/Org');
const { User } = require('../models/User');

const saltRounds = 10;

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
                        newUser['image'] = 'data:image/jpeg;base64,' + Buffer.from(resp.data).toString('base64');
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
            result.forEach(data => {
                if (data['DEPART_CODE'] !== data['empInfo'][0]['CODE_BUSEO'] || data['JOB_CODE'] !== data['empInfo'][0]['CODE_JIKMYUNG']) {
                    User.findOneAndUpdate(
                        {'_id': data['_id']},
                        {'DEPART_CODE': data['empInfo'][0]['CODE_BUSEO'], 'JOB_CODE': data['empInfo'][0]['CODE_JIKMYUNG'], 'JOB_TITLE': data['empInfo'][0]['NM_JIKMYUNG']}
                    ).exec((err) => {
                        if (err) console.log(err);
                        console.log('승진/이동 : ' + data['SABUN']);
                    });
                }
            });
            
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
            target: target
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
            target: target
        }
        return await axios.post(url, body);
    } catch (err) {
        console.error(err);
    }
}

// 통합 알림
// sendInfo : String _id (Option)
// recvInfo : Arrays _id;_id ... ;_id
let callNotify = async (send, recv, title, message) => {
    let sendData = await User.findOne({_id: send}, {'SABUN': 1, '_id': 0});
    let recvData = await User.find({_id: recv}, {'SABUN': 1, '_id': 0});
    let sendInfo;
    if (sendData) {
        sendInfo = sendData['SABUN'];
    }
    let recvInfo = [];
    for (var data of recvData) {
        recvInfo.push(data['SABUN']);
    }
    callIpronetMSG(sendInfo, recvInfo, title, message);
    callNHWithPUSH(sendInfo, recvInfo, title, message);
}

// Ipronet 쪽지 발송
// sendInfo : String SABUN (Option)
// recvInfo : Arrays SABUN;SABUN ... ;SABUN
let callIpronetMSG = async (sendInfo, recvInfo, title, message) => {
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
        let recvObj = await axios.post(url, 'sabuns='+recvInfo, conf);
        // console.log(recvObj);

        // 4. 메시지 전송
        url = config.ipronetURI+'/jsl/NHITMessageAction.Send.jsl';
        conf = {headers: {'Cookie': cookie, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*'}}
        body = {
            sender: sendObj.data['array'][0],
            receivers: recvObj.data['array'],
            title: title,
            content: message + '<br/><br/><br/><a href="' + config.withsignURI + '/" target="_blank">WithSIGN 바로가기</a>',
            attachments:[],
            push:false
        }
        resp = await axios.post(url, 'message='+JSON.stringify(body), conf);
        // console.log(resp);
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
            title: title,
            content: message,
            senderId: sendInfo,
            receivers: recvInfo
        }
        resp = await axios.post(url, JSON.stringify(body), conf);
        console.log(resp);
    } catch (err) {
        console.error(err);
    }
}

module.exports = {callOrgAPI, callUserAPI, callDRMPackaging, callDRMUnpackaging, callNotify, callIpronetMSG, callNHWithPUSH}
