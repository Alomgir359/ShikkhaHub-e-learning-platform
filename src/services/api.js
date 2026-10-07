// // services/api.js
// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:8080/api",
// });

// export default API;


import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export default api;