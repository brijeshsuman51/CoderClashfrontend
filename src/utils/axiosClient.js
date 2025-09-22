// import axios from 'axios'

// const axiosClient = axios.create({
//     // baseURL:'https://coder-clashbackend.vercel.app',
//     baseURL:'http://localhost:3000',
//     withCredentials:true,
//     headers:{
//         'Content-Type':'application/json'
//     }
// })

// export default axiosClient;


// import axios from "axios"

// const axiosClient =  axios.create({
//     baseURL: 'http://localhost:3000',
//     withCredentials: true,
//     headers: {
//         'Content-Type': 'application/json'
//     }
// });


// export default axiosClient;


import axios from 'axios';

const axiosClient = axios.create({
    baseURL:'https://coder-clashbackend.vercel.app',
    // baseURL: 'http://localhost:3000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the token in headers
axiosClient.interceptors.request.use(
    (config) => {
        // Get the token from local storage (or wherever you store it)
        const token = localStorage.getItem('authToken'); // <-- IMPORTANT: Make sure 'authToken' is the correct key you use to save the token during login.

        // If a token exists, add it to the Authorization header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

export default axiosClient;

