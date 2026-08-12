import axios from "axios";

import { env } from "../config/env";

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  // Bearer token attachment lands once the auth module (tokenStorage/authStore) exists.
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 -> silent refresh -> retry lands once the auth module exists.
    return Promise.reject(error);
  }
);
