const axios = require('axios');

let callOrgAPI = async () => {
    console.log('ERP ORG CALL');
    try {
        let url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=zLLoBuAnw34Ms7x0wnus%2FnwlAxXtkPioVIhK91S43rfbfs1kFyi8yC9Sf3K3IkKc2vv3k03SPSJKGxDymY4xRA%3D%3D&pageNo=1&numOfRows=10&dataType=JSON&base_date=20211109&base_time=1430&nx=55&ny=127';
        let body = {}
        let result = await axios.get(url, body);
        return result;
    } catch (err) {
        console.error(err);
    }
}

let callUserAPI = async () => {
    console.log('ERP USER CALL');
    try {
        let url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=zLLoBuAnw34Ms7x0wnus%2FnwlAxXtkPioVIhK91S43rfbfs1kFyi8yC9Sf3K3IkKc2vv3k03SPSJKGxDymY4xRA%3D%3D&pageNo=1&numOfRows=10&dataType=JSON&base_date=20211109&base_time=1400&nx=55&ny=127';
        let body = {}
        let result = await axios.get(url, body);
        return result;
    } catch (err) {
        console.error(err);
    }
}

let callIpronetMSG = () => {
    console.log('IPRONET SEND MESSAGE');
    try {

    } catch (err) {
        console.error(err);
    }
}

module.exports = {callOrgAPI, callUserAPI, callIpronetMSG}
