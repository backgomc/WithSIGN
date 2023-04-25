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

// 요청 후 accessToken 만료 시 refreshToken 을 이용해 accessToken 갱신 처리 요청
// refreshToken 또한 만료 시는 세션만료 처리 후 재로그인 요청
axiosInterceptor.interceptors.response.use(
    async response => {
        // 토큰 관련 실패
        if (response.data.success === false && response.data.isAuth === false) {
            let originalRequest = response.config;
            let config = {
                headers: {'refresh-Token': localStorage.getItem('__rToken__')}
            }

            let resp = await axios.post('/api/users/refresh', null, config);
            if (resp.data.success) {
                resp = await axios(originalRequest);
                response = resp;
            } else {
                alert('세션이 만료되었습니다.');
                window.location.href = '/';
            }
        }
        // 그외 모두 통과
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInterceptor;