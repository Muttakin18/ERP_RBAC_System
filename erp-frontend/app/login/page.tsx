'use client';

import { useState } from 'react';
import api from '../lib/api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/api/auth/login', {
                username,
                password,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('role', response.data.role);

            window.location.href = '/dashboard';

        } catch (err: any) {
            setError(err.response?.data || 'Login failed!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 
                        flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg 
                           shadow-md w-full max-w-md">

                {/* Header */}
                <h1 className="text-2xl font-bold text-center 
                               text-gray-800 mb-2">
                    ERP System
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Sign in to your account
                </p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 text-red-600 
                                   p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Username Input */}
                <div className="mb-4">
                    <label className="block text-gray-700 
                                     text-sm font-bold mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border 
                                  border-gray-300 rounded 
                                  focus:outline-none 
                                  focus:border-blue-500
                                  text-gray-900 bg-white text-base"
                        placeholder="Enter username"
                    />
                </div>

                {/* Password Input */}
                <div className="mb-6">
                    <label className="block text-gray-700 
                                     text-sm font-bold mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border 
                                  border-gray-300 rounded 
                                  focus:outline-none 
                                  focus:border-blue-500
                                  text-gray-900 bg-white text-base"
                        placeholder="Enter password"
                    />
                </div>

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white 
                              py-2 px-4 rounded hover:bg-blue-600 
                              disabled:opacity-50 font-bold mb-4">
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Go to Register */}
                <button
                    onClick={() => window.location.href = '/register'}
                    className="w-full bg-gray-200 text-gray-700 
                              py-2 px-4 rounded hover:bg-gray-300 
                              font-bold">
                    Register New User
                </button>
            </div>
        </div>
    );
}