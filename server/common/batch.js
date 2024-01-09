const cron = require('node-cron');
const {callOrgAPI, callUserAPI} = require('./restful');
const config = require("../config/key");
const { deleteFolder } = require('../common/utils');

// 매일 08:00 - ERP 부서 정보 연계
let orgSyncJob = cron.schedule('00 08 * * 1-5', async function () {
    console.log('orgSyncJob Start');
    // ERP API 호출 및 업데이트
    let result = await callOrgAPI();
    console.log(result);
    console.log('orgSyncJob End');
}, {
    scheduled: false
});

// 매일 08:10 - ERP 사용자 정보 연계
let userSyncJob = cron.schedule('10 08 * * 1-5', async function () {
    console.log('userSyncJob Start');
    // ERP API 호출 및 업데이트
    let result = await callUserAPI();
    console.log(result);
    console.log('userSyncJob End');
}, {
    scheduled: false
});

// 매일 08:15 - 임시 폴더 정리
// tempDownloads : 다건의 문서를 다운로드 하기 위해 임시로 문서 저장한 폴더
let tempDeleteJob = cron.schedule('15 08 * * 1-5', async function () {
    console.log('folderDeleteJob Start');
    
    deleteFolder(config.storageDIR + 'zip/');
    console.log('folderDeleteJob End');
}, {
    scheduled: false
});

module.exports = {orgSyncJob, userSyncJob, tempDeleteJob}
