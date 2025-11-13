
import axios from "axios";
const isLocal = window.location.hostname === "localhost";
const baseURL = import.meta.env.VITE_API_URL;

const axiosClient =  axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});



export default axiosClient;