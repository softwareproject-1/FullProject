'use client'

import { useState } from 'react';
import axios from '@/lib/axios';

export default function ApiTestComponent() {
  const [status, setStatus] = useState<string>('Not tested');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    
    try {
      // Test basic connection to backend
      const result = await axios.get('/');
      setStatus('✅ Connection successful!');
      setResponse(result.data);
    } catch (error: any) {
      setStatus('❌ Connection failed');
      setResponse({
        error: error.message,
        details: error.response?.data || 'Could not reach backend server'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border">
      <h3 className="text-xl font-bold mb-4">API Connection Test</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-600 mb-2">Backend URL:</p>
          <code className="px-2 py-1 bg-slate-100 rounded text-sm">
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
          </code>
        </div>

        <div>
          <p className="text-sm text-slate-600 mb-2">Status:</p>
          <p className="font-medium">{status}</p>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>

        {response && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-2">Response:</p>
            <pre className="p-3 bg-slate-100 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
