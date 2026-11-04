import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '/api', // Благодаря настройки прокси, запросы идут на https://localhost:7062
    headers: {
        'Content-Type': 'application/json',
    },
});

//для JWT токенов
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});