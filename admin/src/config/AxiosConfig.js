import axios from 'axios';

const axiosInterceptor = axios.create();

// 요청 전
axiosInterceptor.interceptors.request.use(
    config => {
        return config;
    },
    response => {
        return response;
    },
    error => {
        return Promise.reject(error);
    },
);

// 요청 후
axiosInterceptor.interceptors.response.use(
    async response => {
        var originalRequest = response.config;
        if ( response.data.message && response.data.message.indexOf('expired') > 0 ) {
            // 토큰 만료 시
            let config = {
                headers: {'refresh-Token': localStorage.getItem('__rToken__')}
            }
            var resp = await axios.post('/api/admin/refresh', null, config);
            if ( resp.data.success ) {
                resp = await axios(originalRequest);
                response = resp;
            } else {
                alert('세션이 만료되었습니다.');
                window.location.href = '/';
            }
        }
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInterceptor;