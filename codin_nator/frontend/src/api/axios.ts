import axios from "axios";
import { setupInterceptors } from "./interceptors";

const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

setupInterceptors(axiosInstance);

export default axiosInstance;
