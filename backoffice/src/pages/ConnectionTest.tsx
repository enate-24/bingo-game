import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import apiService from '../services/apiService';
import { useWebSocket } from '../contexts/WebSocketContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

const ConnectionTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isConnected, connectionStatus } = useWebSocket();

  const initialTests: TestResult[] = [
    { name: 'Backend Health Check', status: 'pending', message: 'Checking backend server...' },
    { name: 'WebSocket Connection', status: 'pending', message: 'Testing WebSocket connection...' },
    { name: 'Dashboard API', status: 'pending', message: 'Testing dashboard endpoints...' },
    { name: 'Authentication API', status: 'pending', message: 'Testing auth endpoints...' },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTests(initialTests);

    const results: TestResult[] = [];

    // Test 1: Backend Health Check
    try {
      const startTime = Date.now();
      const healthResponse = await apiService.getHealthStatus();
      const duration = Date.now() - startTime;
      
      if (healthResponse.success) {
        results.push({
          name: 'Backend Health Check',
          status: 'success',
          message: `Backend is running (${duration}ms)`,
          duration
        });
      } else {
        results.push({
          name: 'Backend Health Check',
          status: 'error',
          message: 'Backend health check failed'
        });
      }
    } catch (error) {
      results.push({
        name: 'Backend Health Check',
        status: 'error',
        message: `Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setTests([...results]);

    // Test 2: WebSocket Connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.push({
      name: 'WebSocket Connection',
      status: isConnected ? 'success' : 'error',
      message: isConnected 
        ? `WebSocket connected (${connectionStatus})` 
        : `WebSocket failed to connect (${connectionStatus})`
    });

    setTests([...results]);

    // Test 3: Dashboard API
    try {
      const startTime = Date.now();
      const dashboardResponse = await apiService.getDashboardOverview();
      const duration = Date.now() - startTime;
      
      if (dashboardResponse.success) {
        results.push({
          name: 'Dashboard API',
          status: 'success',
          message: `Dashboard API working (${duration}ms)`,
          duration
        });
      } else {
        results.push({
          name: 'Dashboard API',
          status: 'error',
          message: 'Dashboard API returned error'
        });
      }
    } catch (error) {
      results.push({
        name: 'Dashboard API',
        status: 'error',
        message: `Dashboard API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setTests([...results]);

    // Test 4: Authentication API (just test the endpoint, not actual auth)
    try {
      const startTime = Date.now();
      // This will likely fail with 401, but that means the endpoint is reachable
      await apiService.getProfile();
      const duration = Date.now() - startTime;
      
      results.push({
        name: 'Authentication API',
        status: 'success',
        message: `Auth API reachable (${duration}ms)`,
        duration
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 401 or authentication errors are actually good - means the endpoint is working
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        results.push({
          name: 'Authentication API',
          status: 'success',
          message: 'Auth API working (authentication required as expected)'
        });
      } else {
        results.push({
          name: 'Authentication API',
          status: 'error',
          message: `Auth API failed: ${errorMessage}`
        });
      }
    }

    setTests([...results]);
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Backend Connection Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testing the connection between backoffice and backend services
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{successCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{errorCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tests.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test Results</h3>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(test.status)}
                    <h4 className="ml-3 font-medium text-gray-900">{test.name}</h4>
                  </div>
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{test.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API URL</p>
              <p className="text-sm text-gray-900 dark:text-white font-mono">
                {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WebSocket URL</p>
              <p className="text-sm text-gray-900 dark:text-white font-mono">
                {import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WebSocket Status</p>
              <p className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Environment</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {import.meta.env.VITE_NODE_ENV || 'development'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
