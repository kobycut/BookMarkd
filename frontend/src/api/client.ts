import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ApiError {
  error?: string;
  message?: string;
  msg?: string;
}

interface LoginResponse {
  token: string;
  user: {
    username: string;
    email: string;
  };
}

interface GoalsResponse {
  goals: Array<{
    id: number;
    description: string;
    type: string;
    duration: string;
    progress: number;
    total: number;
    due_date: string;
  }>;
}

interface VerifyTokenResponse {
  user: {
    username: string;
    email: string;
  };
}

interface BooksResponse extends Array<{
  id: number;
  title: string;
  author: string;
  status: 'read' | 'reading' | 'wishlist';
  open_library_id?: string;
  page_progress: number;
  total_pages: number;
  rating?: number;
}> {}

const getToken = () => localStorage.getItem('token');

const handleError = (response: Response, data: unknown): string => {
  const apiData = data as ApiError | null;
  const errorMsg = apiData?.error || apiData?.message || apiData?.msg || response.statusText || 'Unknown error';
  toast.error(String(errorMsg));
  return errorMsg;
};

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

const makeRequest = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { method = 'GET', body, requiresAuth = true, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers: finalHeaders,
    ...(body && { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    handleError(res, data);
    throw new Error('API request failed');
  }

  return data as T;
};

export const api = {
  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return makeRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: email.toLowerCase(), password },
      requiresAuth: false,
    });
  },

  async register(email: string, password: string, username: string): Promise<LoginResponse> {
    return makeRequest<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: { email: email.toLowerCase(), password, username },
      requiresAuth: false,
    });
  },

  async verifyToken(): Promise<VerifyTokenResponse | null> {
    const token = getToken();
    if (!token) return null;

    try {
      return await makeRequest<VerifyTokenResponse>('/api/auth/me', {
        method: 'GET',
        requiresAuth: true,
      });
    } catch (err) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await makeRequest<void>('/api/auth/logout', {
        method: 'POST',
        requiresAuth: true,
      });
    } catch (err) {
      // Ignore errors on logout, still clear local token
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
    }
  },

  // Goals endpoints
  async getGoals(): Promise<GoalsResponse> {
    return makeRequest<GoalsResponse>('/api/goals', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async createGoal(type: string, amount: number, duration: string): Promise<{ success: boolean }> {
    await makeRequest<void>('/api/goals', {
      method: 'POST',
      body: { amount, type, duration },
      requiresAuth: true,
    });
    return { success: true };
  },

  async updateGoalProgress(goalId: number, progress: number): Promise<{ success: boolean }> {
    await makeRequest<void>(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: { progress },
      requiresAuth: true,
    });
    return { success: true };
  },

  async deleteGoal(goalId: number): Promise<{ success: boolean }> {
    await makeRequest<void>(`/api/goals/${goalId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return { success: true };
  },
  
  async getRecommendations(survey: any): Promise<{ recommendations: any[]; survey: any }> {
    return makeRequest<{ recommendations: any[]; survey: any }>('/api/recommendations', {
      method: 'POST',
      body: survey,
      requiresAuth: true,
    });
  },

  // Books endpoints
  async createBook(title: string, author: string, page_progress: number, total_pages: number, open_library_id: string): Promise<{ success: boolean }> {
    await makeRequest<void>('/api/books', {
      method: 'POST',
      body: { title, author, page_progress, total_pages, open_library_id },
      requiresAuth: true,
    });
    return { success: true };
  },

  async getBooks(): Promise<BooksResponse> {
    return makeRequest<BooksResponse>('/api/books', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async updateBookRating(bookId: number, rating: number): Promise<{ success: boolean }> {
    await makeRequest<void>(`/api/books/${bookId}/rating`, {
      method: 'PUT',
      body: { rating },
      requiresAuth: true,
    });
    return { success: true };
  },

  async updateBookProgress(bookId: number, page_progress: number): Promise<{ success: boolean }> {
    await makeRequest<void>(`/api/books/${bookId}/progress`, {
      method: 'PUT',
      body: { page_progress },
      requiresAuth: true,
    });
    return { success: true };
  },

  async deleteBook(bookId: number): Promise<{ success: boolean }> {
    await makeRequest<void>(`/api/books/${bookId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return { success: true };
  },
};
