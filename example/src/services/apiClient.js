

import { SecureToken } from '../utils/secureTokenStorage';

class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8888/.netlify/functions';
    this.timeout = 10000; // 10 seconds
    this.retryCount = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Get headers with authentication (async version)
  async getHeaders() {
    // Use SecureToken to get token (or fallback to tokenManager)
    const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Enhanced sendRequest method from legacy code
  async sendRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('❌ Network error:', error);
      throw error;
    }
  }

  // Base request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      method: 'GET',
      headers,
      timeout: this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (attempt < this.retryCount - 1) {
          console.warn(`Request failed, retrying in ${this.retryDelay}ms... (attempt ${attempt + 1}/${this.retryCount})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Upload file
  async uploadFile(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${endpoint}`;
    // Use SecureToken to get token (or fallback to tokenManager)
    const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('token');
    const config = {
      method: 'POST',
      headers: {
        ...(token && { 
          Authorization: `Bearer ${token}` 
        })
      },
      body: formData,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Download file
  async downloadFile(endpoint, filename, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      method: 'GET',
      headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error;
    }
  }

  // Enhanced debug functions from legacy code with Tailwind CSS styling
  ensureDebugOutput() {
    let debugOutput = document.getElementById('debug-output');
    if (!debugOutput) {
      debugOutput = document.createElement('div');
      debugOutput.id = 'debug-output';
      debugOutput.className = 'fixed top-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 overflow-auto';
      debugOutput.innerHTML = '<div class="text-sm font-mono text-gray-800">Debug Output</div>';
      document.body.appendChild(debugOutput);
    }
    return debugOutput;
  }

  // Test database connection with debug output
  async testDbConnection() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/test-db-connection');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Database Connection Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return {
        success: true,
        message: 'Database connection successful',
        data: data
      };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Database Connection Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  // Test student login with debug output
  async testStudentLogin() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: '51706', password: '1' })
      });
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Student Login Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Student Login Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test teacher login with debug output
  async testTeacherLogin() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Aleksandr_Petrov', password: '465' })
      });
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Teacher Login Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Teacher Login Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test admin login with debug output
  async testAdminLogin() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Admin Login Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Admin Login Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test get subjects with debug output
  async testGetSubjects() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/get-subjects');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Get Subjects Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Get Subjects Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test get teacher subjects with debug output
  async testGetTeacherSubjects() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/get-teacher-subjects');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Get Teacher Subjects Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Get Teacher Subjects Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test get class results with debug output
  async testGetClassResults() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/get-class-results');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Get Class Results Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Get Class Results Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test get student subjects with debug output
  async testGetStudentSubjects() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/get-student-subjects');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Get Student Subjects Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Get Student Subjects Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test get student test results with debug output
  async testGetStudentTestResults() {
    try {
      const debugOutput = this.ensureDebugOutput();
      const response = await fetch('/.netlify/functions/get-student-test-results');
      const data = await response.json();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Get Student Test Results Test</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        `;
      }
      return { success: true, data: data };
    } catch (error) {
      const debugOutput = this.ensureDebugOutput();
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Get Student Test Results Error</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      return { success: false, error: error.message };
    }
  }

  // Test API endpoints
  async testEndpoints() {
    const endpoints = [
      '/debug/test-student-login',
      '/debug/test-teacher-login',
      '/debug/test-admin-login',
      '/debug/test-get-subjects',
      '/debug/test-get-teacher-subjects',
      '/debug/test-get-class-results',
      '/debug/test-get-student-subjects',
      '/debug/test-get-student-test-results'
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.get(endpoint);
        results[endpoint] = { success: true, data: response };
      } catch (error) {
        results[endpoint] = { success: false, error: error.message };
      }
    }

    return results;
  }

  // Debug function from legacy code
  async debugFunction(functionName) {
    const debugOutput = this.ensureDebugOutput();
    
    try {
      let result;
      switch (functionName) {
        case 'testDbConnection':
          result = await this.testDbConnection();
          break;
        case 'testStudentLogin':
          result = await this.testStudentLogin();
          break;
        case 'testTeacherLogin':
          result = await this.testTeacherLogin();
          break;
        case 'testAdminLogin':
          result = await this.testAdminLogin();
          break;
        case 'testGetSubjects':
          result = await this.testGetSubjects();
          break;
        case 'testGetTeacherSubjects':
          result = await this.testGetTeacherSubjects();
          break;
        case 'testGetClassResults':
          result = await this.testGetClassResults();
          break;
        case 'testGetStudentSubjects':
          result = await this.testGetStudentSubjects();
          break;
        case 'testGetStudentTestResults':
          result = await this.testGetStudentTestResults();
          break;
        default:
          throw new Error(`Unknown debug function: ${functionName}`);
      }
      
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-gray-800 mb-2">Debug Function: ${functionName}</div>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(result, null, 2)}</pre>
        `;
      }
      
      return result;
    } catch (error) {
      if (debugOutput) {
        debugOutput.innerHTML = `
          <div class="text-sm font-mono text-red-600 mb-2">Debug Function Error: ${functionName}</div>
          <pre class="text-xs bg-red-100 p-2 rounded overflow-auto">Error: ${error.message}</pre>
        `;
      }
      throw error;
    }
  }

  // Show debug functions with Tailwind CSS styling
  showDebugFunctions() {
    const debugOutput = this.ensureDebugOutput();
    
    const debugButtons = `
      <div class="text-sm font-mono text-gray-800 mb-4">Debug Functions</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <button onclick="apiClient.testDbConnection()" class="px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
          Test DB Connection
        </button>
        <button onclick="apiClient.testStudentLogin()" class="px-3 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
          Test Student Login
        </button>
        <button onclick="apiClient.testTeacherLogin()" class="px-3 py-2 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors">
          Test Teacher Login
        </button>
        <button onclick="apiClient.testAdminLogin()" class="px-3 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors">
          Test Admin Login
        </button>
        <button onclick="apiClient.testGetSubjects()" class="px-3 py-2 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors">
          Test Get Subjects
        </button>
        <button onclick="apiClient.testGetTeacherSubjects()" class="px-3 py-2 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 transition-colors">
          Test Get Teacher Subjects
        </button>
        <button onclick="apiClient.testGetClassResults()" class="px-3 py-2 bg-pink-500 text-white text-xs rounded hover:bg-pink-600 transition-colors">
          Test Get Class Results
        </button>
        <button onclick="apiClient.testGetStudentSubjects()" class="px-3 py-2 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 transition-colors">
          Test Get Student Subjects
        </button>
        <button onclick="apiClient.testGetStudentTestResults()" class="px-3 py-2 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors">
          Test Get Student Test Results
        </button>
        <button onclick="apiClient.testEndpoints()" class="px-3 py-2 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors">
          Test All Endpoints
        </button>
      </div>
    `;
    
    debugOutput.innerHTML = debugButtons;
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();
export default apiClient;