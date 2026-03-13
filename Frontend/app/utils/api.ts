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
       const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      return response.json();
    },
    getById: async (id: string) => {
const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
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
          const response = await fetch(`${API_BASE_URL}/ngos/approve/${ngoId}`, {
        method: 'PUT',
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
  const response = await fetch(`${API_BASE_URL}/ngos/reject/${ngoId}`, {
        method: 'PUT',
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
            const response = await fetch(`${API_BASE_URL}/cases/create`, {
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
    donate: async (caseId: string, data: any) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/donate`, {
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
     create: async (data: FormData) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/products/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
        credentials: 'include',
      });
      return response.json();
    },
    updateStock: async (productId: string, quantity: number) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
        credentials: 'include',
      });
      return response.json();
    },
    delete: async (productId: string) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/products/${productId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      return response.json();
    },
    donate: async (productId: string, data: any) => {
      const token = sessionStorage.getItem('accessToken');
     const response = await fetch(`${API_BASE_URL}/products/${productId}/donate`, {
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


  ngo: {
    donate: async (ngoId: string, data: any) => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/donate`, {
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
    getDonations: async (ngoId: string, limit = 20) => {
      const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}/donations?limit=${limit}`);
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
     getDashboardStats: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transactions/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
    getPaymentHistory: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transactions/payment-history`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
  },

  // SuperAdmin Dashboard APIs
  superAdminDashboard: {
    getProductSales: async () => {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/superAdminDashboard/product-sales`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.json();
    },
  },
};

export default apiClient;
