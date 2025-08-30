import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class ApiService {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = { ...this.getDefaultHeaders(), ...headers };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === HTTP_STATUS.UNAUTHORIZED) {
          // Handle token expiration
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  private async makeRequestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors or client errors
        if (lastError.message.includes('Authentication required') || 
            lastError.message.includes('HTTP 4')) {
          throw lastError;
        }

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.makeRequest<{ token: string; user: any }>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: { email, password },
      }
    );

    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
      return response;
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.AUTH.PROFILE);
  }

  // Dashboard methods
  async getDashboardOverview(): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.DASHBOARD.OVERVIEW);
  }

  async getGameStatistics(): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.DASHBOARD.GAME_STATISTICS);
  }

  async getFinancialSummary(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    let url = API_ENDPOINTS.DASHBOARD.FINANCIAL_SUMMARY;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.makeRequestWithRetry(url);
  }

  // Games methods
  async getGames(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.GAMES.LIST}?page=${page}&limit=${limit}`);
  }

  async getActiveGames(): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.GAMES.ACTIVE);
  }

  async getCurrentGame(): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.GAMES.CURRENT);
  }

  async createGame(gameData: any): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.GAMES.CREATE, {
      method: 'POST',
      body: gameData,
    });
  }

  async updateGame(gameId: string, gameData: any): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.GAMES.UPDATE}/${gameId}`, {
      method: 'PUT',
      body: gameData,
    });
  }

  async startGame(gameId: string): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.GAMES.START}/${gameId}`, {
      method: 'POST',
    });
  }

  async pauseGame(gameId: string): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.GAMES.PAUSE}/${gameId}`, {
      method: 'POST',
    });
  }

  async finishGame(gameId: string): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.GAMES.FINISH}/${gameId}`, {
      method: 'POST',
    });
  }

  // Cartelas methods
  async getCartelas(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.CARTELAS.LIST}?page=${page}&limit=${limit}`);
  }

  async getUserCartelas(userId?: string): Promise<ApiResponse<any>> {
    const endpoint = userId 
      ? `${API_ENDPOINTS.CARTELAS.USER_CARTELAS}/${userId}`
      : API_ENDPOINTS.CARTELAS.USER_CARTELAS;
    return this.makeRequestWithRetry(endpoint);
  }

  async createCartela(cartelaData: any): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.CARTELAS.CREATE, {
      method: 'POST',
      body: cartelaData,
    });
  }

  async updateCartela(cartelaId: string, cartelaData: any): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.CARTELAS.UPDATE}/${cartelaId}`, {
      method: 'PUT',
      body: cartelaData,
    });
  }

  async deleteCartela(cartelaId: string): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(`${API_ENDPOINTS.CARTELAS.DELETE}/${cartelaId}`, {
      method: 'DELETE',
    });
  }

  // Transactions methods
  async getTransactions(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<any>> {
    let url = `${API_ENDPOINTS.TRANSACTIONS.LIST}?page=${page}&limit=${limit}`;
    
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
    }

    return this.makeRequestWithRetry(url);
  }

  async getUserTransactions(userId?: string): Promise<ApiResponse<any>> {
    const endpoint = userId 
      ? `${API_ENDPOINTS.TRANSACTIONS.USER_TRANSACTIONS}/${userId}`
      : API_ENDPOINTS.TRANSACTIONS.USER_TRANSACTIONS;
    return this.makeRequestWithRetry(endpoint);
  }

  async createTransaction(transactionData: any): Promise<ApiResponse<any>> {
    return this.makeRequestWithRetry(API_ENDPOINTS.TRANSACTIONS.CREATE, {
      method: 'POST',
      body: transactionData,
    });
  }

  // Health check methods
  async getHealthStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.HEALTH);
  }

  async getWebSocketStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.WS_STATUS);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
