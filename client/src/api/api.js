import axios from 'axios';

export function loginUser(dataToSubmit) {

    const request = axios.post('/api/users/login', dataToSubmit)
        .then(response => response.data)

    return {
        payload: request
    }
}

export function registerUser(dataToSubmit) {

    const request = axios.post('/api/users/register', dataToSubmit)
        .then(response => response.data)

    return {
        payload: request
    }
}

export function auth() {

    const request = axios.get('/api/users/auth')
        .then(response => response.data)

    return {
        payload: request
    }
}