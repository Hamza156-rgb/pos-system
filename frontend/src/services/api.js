import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { logoutLocal(); return Promise.reject(error); }
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post((import.meta.env.VITE_API_URL || '/api') + '/auth/refresh', { refreshToken });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        logoutLocal();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

function logoutLocal() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (!window.location.pathname.includes('/login')) window.location.href = '/login';
}

export default api;
