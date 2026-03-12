// API utility to handle all backend calls with environment variables

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

export const apiClient = {
  // User APIs
  user: {
    register: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
    login: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
    logout: async () => {
      const response = await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.json();
    },
  },

  // NGO Admin APIs
  ngoAdmin: {
    register: async (formData: FormData) => {
      const response = await fetch(`${API_BASE_URL}/ngoAdmin/register`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return response.json();
    },
    login: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/ngoAdmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
    logout: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngoAdmin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
    getCurrent: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngoAdmin/current`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
  },
  // Super Admin APIs
  superAdmin: {
    login: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/superAdmin/login-superAdmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
  },

  // NGO APIs
  ngos: {
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE_URL}/ngos${queryString}`);
      return response.json();
    },
    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/ngos/${id}`);
      return response.json();
    },
    register: async (formData: FormData) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: 'include',
      });
      return response.json();
    },
    approve: async (ngoId: string, remarks: string) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks }),
        credentials: 'include',
      });
      return response.json();
    },
    reject: async (ngoId: string, reason: string) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });
      return response.json();
    },
  },

  // Fundraising Cases APIs
  cases: {
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE_URL}/cases${queryString}`);
      return response.json();
    },
    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/cases/${id}`);
      return response.json();
    },
    create: async (data: any) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
  },

  // Products APIs
  products: {
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE_URL}/products${queryString}`);
      return response.json();
    },
    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      return response.json();
    },
    create: async (data: any) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
  },

  // Transactions APIs
  transactions: {
    getAll: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
    create: async (data: any) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
  },
};

export default apiClient;
