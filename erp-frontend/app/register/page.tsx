'use client';

import { useState } from 'react';
import api from '../lib/api';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Employee');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/api/auth/register', {
                username,
                password,
                role,
            });

            setSuccess('User registered successfully!');
            setUsername('');
            setPassword('');
            setRole('Employee');

        } catch (err: any) {
            setError(err.response?.data || 'Registration failed!');
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
                    Register User
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Create a new user account
                </p>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-100 text-green-600 
                                   p-3 rounded mb-4 text-sm">
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 text-red-600 
                                   p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Username */}
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

                {/* Password */}
                <div className="mb-4">
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

                {/* Role Dropdown */}
                <div className="mb-6">
                    <label className="block text-gray-700 
                                     text-sm font-bold mb-2">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border 
                                  border-gray-300 rounded 
                                  focus:outline-none 
                                  focus:border-blue-500
                                  text-gray-900 bg-white text-base">
                        <option value="Admin">Admin</option>
                        <option value="HR">HR</option>
                        <option value="TL">TL</option>
                        <option value="Employee">Employee</option>
                    </select>
                </div>

                {/* Register Button */}
                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-green-500 text-white 
                              py-2 px-4 rounded hover:bg-green-600 
                              disabled:opacity-50 font-bold mb-4">
                    {loading ? 'Registering...' : 'Register'}
                </button>

                {/* Back to Login */}
                <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-gray-200 text-gray-700 
                              py-2 px-4 rounded hover:bg-gray-300 
                              font-bold">
                    Back to Login
                </button>
            </div>
        </div>
    );
}