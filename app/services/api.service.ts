import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { API_URL, API_ENDPOINT, API_FUNCTIONS } from "../config/api.config";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_URL}${API_ENDPOINT}`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Interface for API response
interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

// Generic function to handle API responses
const handleResponse = <T>(response: AxiosResponse): ApiResponse<T> => {
  return {
    data: response.data,
    error: null,
    status: response.status,
  };
};

// Generic function to handle API errors
const handleError = (error: any): ApiResponse<null> => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      data: null,
      error: error.response.data?.message || "Server error",
      status: error.response.status,
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      data: null,
      error: "No response received from server",
      status: 0,
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      data: null,
      error: error.message || "Unknown error occurred",
      status: 0,
    };
  }
};

// API service class
class ApiService {
  // GET request
  async get<T>(
    endpoint: string,
    params?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T | null>> {
    try {
      const response = await apiClient.get(endpoint, {
        params,
        ...config,
      });
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T | null>> {
    try {
      const response = await apiClient.post(endpoint, data, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T | null>> {
    try {
      const response = await apiClient.put(endpoint, data, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T | null>> {
    try {
      const response = await apiClient.delete(endpoint, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Convenience method for getLeads
  async getLeads<T>(
    params?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T | null>> {
    return this.get<T>(API_FUNCTIONS.getLeads, params, config);
  }
}

// Export a singleton instance
export const apiService = new ApiService();
