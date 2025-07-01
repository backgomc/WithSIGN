module.exports = {
    // mongoURI: "mongodb://mongo/nhsign",
    //mongoURI: "mongodb://localhost/nhsign",
    mongoURI: "mongodb://nhit:nacf1234!@10.146.0.4:9017/nhsign?authSource=admin",
    storageDIR: "storage/",
    documentDIR: "documents/",
    thumbnailDIR: "thumbnails/",
    profileDIR: "profiles/",
    erpURI: "http://10.220.210.165",
    drmURI: "http://localhost:4001",
    ipronetURI: "http://10.220.210.44",
    ipronetID: "nhsign",
    ipronetPW: "nacf1234!",
    // nhwithURI: "http://10.220.210.44:8090",    // 내부 개발망
    nhwithURI: "http://192.168.161.27:8090",    // 외부 개발망
    //nhwithURI: "http://192.168.161.160:8090",    // 외부 개발망
    nhwithID: "NHSIGN",
    nhwithPW: "aaaabbbb",
    nhwithSNDR: "fa81071cefc938ebc99e01dc7677cd24",
    withsignURI: "http://10.220.141.91:3001",
    blockURI: "http://localhost:3003",
    gotenbergURI: "http://localhost:3018",
    withsignMobileURI: "http://sign.nhitlab.com:3004",
    // 개발환경용 GCP 링크 베이스 URL
    linkBaseUrl: "http://34.64.93.94:3000"
}
