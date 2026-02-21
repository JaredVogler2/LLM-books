const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('sf_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sf_token');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/v1${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Children
  async createChild(data: Record<string, unknown>) {
    return this.request('/children', { method: 'POST', body: JSON.stringify(data) });
  }

  async getChildren() {
    return this.request<any[]>('/children');
  }

  // Books
  async createBook(data: Record<string, unknown>) {
    return this.request<any>('/books', { method: 'POST', body: JSON.stringify(data) });
  }

  async startGeneration(bookId: string) {
    return this.request(`/books/${bookId}/generate`, { method: 'POST' });
  }

  async getBook(bookId: string) {
    return this.request<any>(`/books/${bookId}`);
  }

  async getBooks() {
    return this.request<any[]>('/books');
  }

  async getBookPrice(bookId: string) {
    return this.request<{ priceCents: number; priceFormatted: string }>(`/books/${bookId}/price`);
  }

  // Orders
  async createOrder(data: Record<string, unknown>) {
    return this.request<any>('/orders', { method: 'POST', body: JSON.stringify(data) });
  }

  async getOrders() {
    return this.request<any[]>('/orders');
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  // Payments
  async createPayment(orderId: string) {
    return this.request<{ clientSecret: string; publishableKey: string }>(
      `/payments/orders/${orderId}/pay`,
      { method: 'POST' },
    );
  }

  // Subscriptions
  async createSubscription(type: string, childProfileId: string) {
    return this.request<any>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ type, childProfileId }),
    });
  }

  async getSubscriptions() {
    return this.request<any[]>('/subscriptions');
  }

  // User
  async getProfile() {
    return this.request<any>('/users/me');
  }
}

export const api = new ApiClient();
