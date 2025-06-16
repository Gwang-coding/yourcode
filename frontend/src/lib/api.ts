import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 토큰 인터셉터
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (username: string, password: string) => api.post('/auth?action=login', { username, password }),

    register: (username: string, email: string, password: string) => api.post('/auth?action=register', { username, email, password }),

    verify: () => api.get('/auth?action=verify'),
};

export const postsAPI = {
    getSwipeablePosts: () => api.get('/posts?action=swipe'),

    getUserPosts: (userId: number) => api.get(`/posts?action=user&userId=${userId}`),

    getPostDetail: (postId: number) => api.get(`/posts?action=detail&id=${postId}`),

    createPost: (data: { title: string; code_image: string; language?: string; description?: string }) => api.post('/posts', data),

    likePost: (postId: number) => api.post('/posts?action=like', { postId }),

    passPost: (postId: number) => api.post('/posts?action=pass', { postId }),

    deletePost: (postId: number) => api.delete(`/posts?id=${postId}`),
};

export const uploadAPI = {
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        return api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export const usersAPI = {
    searchUsers: (query: string) => api.get(`/users?action=search&q=${query}`),

    getUserProfile: (userId: number) => api.get(`/users?action=profile&id=${userId}`),

    updateProfile: (data: { bio?: string; profile_image?: string; github_url?: string }) => api.post('/users?action=update', data),
};

export default api;
