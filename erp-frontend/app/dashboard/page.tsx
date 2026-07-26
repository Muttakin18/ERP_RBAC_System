'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function DashboardPage() {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        const storedRole = localStorage.getItem('role');

        if (!storedUsername) {
            window.location.href = '/login';
            return;
        }

        setUsername(storedUsername);
        setRole(storedRole || '');

        if (storedRole === 'Admin') {
            api.get('/api/users')
                .then(res => setUsers(res.data))
                .catch(err => console.error(err));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-blue-600 text-white px-6 py-4
                           flex justify-between items-center">
                <h1 className="text-xl font-bold">ERP System</h1>
                <div className="flex items-center gap-4">
                    <span>👤 {username}</span>
                    <span className="bg-blue-800 px-3 py-1
                                   rounded-full text-sm">
                        {role}
                    </span>

                    {/* Admin Only Buttons */}
                   {role === 'Admin' && (
    <>
        <button
            onClick={() =>
                window.location.href = '/permissions'}
            className="bg-green-500 px-4 py-1
                      rounded hover:bg-green-600
                      font-semibold">
            🔐 Permission Matrix
        </button>
        <button
            onClick={() =>
                window.location.href = '/user-permissions'}
            className="bg-purple-500 px-4 py-1
                      rounded hover:bg-purple-600
                      font-semibold">
            👤 User Permissions
        </button>
        <button
            onClick={() =>
                window.location.href = '/register'}
            className="bg-yellow-500 px-4 py-1
                      rounded hover:bg-yellow-600
                      font-semibold">
            ➕ Add User
        </button>
    </>
)}

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 px-4 py-1
                                  rounded hover:bg-red-600
                                  font-semibold">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="p-6">

                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Welcome, {username}! 👋
                    </h2>
                    <p className="text-gray-500 mt-1">
                        You are logged in as <strong>{role}</strong>
                    </p>
                </div>

                {/* Module Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div
                        onClick={() =>
                            window.location.href = '/shift'}
                        className="bg-white rounded-lg shadow p-6
                                  hover:shadow-lg cursor-pointer
                                  border-l-4 border-blue-500
                                  transition-shadow">
                        <h3 className="text-gray-500 text-sm
                                     uppercase tracking-wide">
                            Module
                        </h3>
                        <p className="text-2xl font-bold
                                    text-blue-600 mt-1">
                            🕐 Shift
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Manage work shifts
                        </p>
                        <p className="text-blue-500 text-sm mt-3
                                    font-medium">
                            Click to open →
                        </p>
                    </div>
                    <div
                        onClick={() =>
                            window.location.href = '/designation'}
                        className="bg-white rounded-lg shadow p-6
                                  hover:shadow-lg cursor-pointer
                                  border-l-4 border-green-500
                                  transition-shadow">
                        <h3 className="text-gray-500 text-sm
                                     uppercase tracking-wide">
                            Module
                        </h3>
                        <p className="text-2xl font-bold
                                    text-green-600 mt-1">
                            👔 Designation
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Manage designations
                        </p>
                        <p className="text-green-500 text-sm mt-3
                                    font-medium">
                            Click to open →
                        </p>
                    </div>
                    <div
                        onClick={() =>
                            window.location.href = '/department'}
                        className="bg-white rounded-lg shadow p-6
                                  hover:shadow-lg cursor-pointer
                                  border-l-4 border-purple-500
                                  transition-shadow">
                        <h3 className="text-gray-500 text-sm
                                     uppercase tracking-wide">
                            Module
                        </h3>
                        <p className="text-2xl font-bold
                                    text-purple-600 mt-1">
                            🏢 Department
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Manage departments
                        </p>
                        <p className="text-purple-500 text-sm mt-3
                                    font-medium">
                            Click to open →
                        </p>
                    </div>

                    {/* Audit Logs — Admin Only */}
                    {role === 'Admin' && (
                        <div
                            id="card-audit-logs"
                            onClick={() =>
                                window.location.href = '/audit-logs'}
                            className="bg-white rounded-lg shadow p-6
                                      hover:shadow-lg cursor-pointer
                                      border-l-4 border-orange-500
                                      transition-shadow">
                            <h3 className="text-gray-500 text-sm
                                         uppercase tracking-wide">
                                Admin
                            </h3>
                            <p className="text-2xl font-bold
                                        text-orange-600 mt-1">
                                📋 Audit Logs
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                View all system activity
                            </p>
                            <p className="text-orange-500 text-sm mt-3
                                        font-medium">
                                Click to open →
                            </p>
                        </div>
                    )}
                </div>

                {/* Users Table - Admin Only */}
                {role === 'Admin' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold
                                     text-gray-800 mb-4">
                            👥 All Users
                        </h2>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        ID
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Username
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Role
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user: any) => (
                                    <tr key={user.id}
                                        className="border-t
                                                 hover:bg-gray-50">
                                        <td className="p-3
                                                     text-gray-700">
                                            {user.id}
                                        </td>
                                        <td className="p-3
                                                     text-gray-700
                                                     font-medium">
                                            {user.username}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1
                                                rounded-full text-sm
                                                font-medium
                                                ${user.role.name === 'Admin'
                                                    ? 'bg-red-100 text-red-700'
                                                    : user.role.name === 'HR'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : user.role.name === 'TL'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {user.role.name}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}