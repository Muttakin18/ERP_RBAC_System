'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';

const MODULES = ['Shift', 'Designation', 'Department'];
const PERMISSIONS = ['VIEW', 'ADD', 'UPDATE', 'DELETE'];

export default function UserPermissionsPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userPerms, setUserPerms] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [pendingChanges, setPendingChanges] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'Admin') {
            window.location.href = '/dashboard';
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUserPermissions = async (username: string) => {
        setLoading(true);
        try {
            const res = await api.get(
                `/api/user-permissions/${username}`);
            setUserPerms(res.data);

            // Build pending changes from individual perms
            const pending: any = {};
            MODULES.forEach(mod => {
                pending[mod] = {};
                PERMISSIONS.forEach(perm => {
                    pending[mod][perm] = false;
                });
            });

            // Mark existing individual permissions
            res.data.individualPermissions?.forEach(
                (p: any) => {
                    const mod = p.module.name;
                    const perm = p.permission.name;
                    if (pending[mod]) {
                        pending[mod][perm] = true;
                    }
                });

            setPendingChanges(pending);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user: any) => {
        setSelectedUser(user);
        fetchUserPermissions(user.username);
    };

    const handleToggle = (mod: string, perm: string) => {
        const updated = JSON.parse(
            JSON.stringify(pendingChanges));
        updated[mod][perm] = !updated[mod][perm];
        setPendingChanges(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Get current individual permissions
            const current = userPerms
                .individualPermissions || [];

            for (const mod of MODULES) {
                for (const perm of PERMISSIONS) {
                    const wasActive = current.some(
                        (p: any) =>
                            p.module.name === mod &&
                            p.permission.name === perm
                    );
                    const isActive =
                        pendingChanges[mod]?.[perm];

                    if (!wasActive && isActive) {
                        // Add new permission
                        await api.post(
                            '/api/user-permissions/assign',
                            {
                                username:
                                    selectedUser.username,
                                module: mod,
                                permission: perm
                            }
                        );
                    } else if (wasActive && !isActive) {
                        // Remove permission
                        await api.delete(
                            '/api/user-permissions/remove',
                            {
                                data: {
                                    username:
                                        selectedUser.username,
                                    module: mod,
                                    permission: perm
                                }
                            }
                        );
                    }
                }
            }

            setMessage(
                '✅ Individual permissions saved!');
            setMessageType('success');
            fetchUserPermissions(selectedUser.username);
        } catch (err) {
            setMessage('❌ Error saving permissions!');
            setMessageType('error');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleReset = () => {
        const pending: any = {};
        MODULES.forEach(mod => {
            pending[mod] = {};
            PERMISSIONS.forEach(perm => {
                pending[mod][perm] = false;
            });
        });
        userPerms?.individualPermissions?.forEach(
            (p: any) => {
                const mod = p.module.name;
                const perm = p.permission.name;
                if (pending[mod]) {
                    pending[mod][perm] = true;
                }
            });
        setPendingChanges(pending);
        setMessage('🔄 Changes reset!');
        setMessageType('warning');
        setTimeout(() => setMessage(''), 3000);
    };

    // Check if role has permission
    const roleHasPerm = (mod: string, perm: string) => {
        return userPerms?.rolePermissions?.some(
            (p: any) =>
                p.module.name === mod &&
                p.permission.name === perm
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-blue-600 text-white
                           px-6 py-4 flex justify-between
                           items-center">
                <h1 className="text-xl font-bold">
                    👤 Individual User Permissions
                </h1>
                <button
                    onClick={() =>
                        window.location.href = '/dashboard'}
                    className="bg-blue-800 px-4 py-1
                              rounded hover:bg-blue-900">
                    ← Back to Dashboard
                </button>
            </nav>

            <div className="p-6">

                {/* Message */}
                {message && (
                    <div className={`p-3 rounded mb-4
                        font-medium
                        ${messageType === 'success'
                            ? 'bg-green-100 text-green-700'
                            : messageType === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-4 gap-6">

                    {/* User List */}
                    <div className="col-span-1 bg-white
                                   rounded-lg shadow p-4">
                        <h2 className="font-bold
                                     text-gray-800 mb-4">
                            👥 Select User
                        </h2>
                        {users.map((user: any) => (
                            <div
                                key={user.id}
                                onClick={() =>
                                    handleUserSelect(user)}
                                className={`p-3 rounded-lg
                                    cursor-pointer mb-2
                                    border transition-colors
                                    ${selectedUser?.id === user.id
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }`}>
                                <p className="font-medium
                                           text-gray-800">
                                    👤 {user.username}
                                </p>
                                <span className={`text-xs
                                    px-2 py-1 rounded-full
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
                            </div>
                        ))}
                    </div>

                    {/* Permission Matrix */}
                    <div className="col-span-3">
                        {!selectedUser ? (
                            <div className="bg-white
                                          rounded-lg shadow p-8
                                          text-center">
                                <p className="text-gray-500
                                           text-lg">
                                    👈 Select a user to manage
                                    their individual permissions
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="bg-white
                                          rounded-lg shadow p-8
                                          text-center">
                                <p className="text-gray-500">
                                    Loading permissions...
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white
                                          rounded-lg shadow p-6">
                                {/* User Info */}
                                <div className="flex
                                              justify-between
                                              items-center mb-6">
                                    <div>
                                        <h2 className="text-xl
                                                     font-bold
                                                     text-gray-800">
                                            👤 {selectedUser.username}
                                        </h2>
                                        <p className="text-gray-500
                                                    text-sm">
                                            Role: {userPerms?.role}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-green-500
                                                      text-white px-4
                                                      py-2 rounded-lg
                                                      hover:bg-green-600
                                                      font-bold
                                                      disabled:opacity-50">
                                            {saving
                                                ? '💾 Saving...'
                                                : '💾 Save'}
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            disabled={saving}
                                            className="bg-yellow-500
                                                      text-white px-4
                                                      py-2 rounded-lg
                                                      hover:bg-yellow-600
                                                      font-bold
                                                      disabled:opacity-50">
                                            🔄 Reset
                                        </button>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex gap-4 mb-4
                                              text-sm">
                                    <div className="flex
                                                  items-center gap-1">
                                        <div className="w-4 h-4
                                                      rounded-full
                                                      bg-blue-500">
                                        </div>
                                        <span>Role Permission</span>
                                    </div>
                                    <div className="flex
                                                  items-center gap-1">
                                        <div className="w-4 h-4
                                                      rounded-full
                                                      bg-green-500">
                                        </div>
                                        <span>Individual Override</span>
                                    </div>
                                    <div className="flex
                                                  items-center gap-1">
                                        <div className="w-4 h-4
                                                      rounded-full
                                                      bg-gray-200">
                                        </div>
                                        <span>No Permission</span>
                                    </div>
                                </div>

                                {/* Matrix Table */}
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="text-left
                                                         p-3
                                                         text-gray-700
                                                         font-bold">
                                                Module
                                            </th>
                                            {PERMISSIONS.map(perm => (
                                                <th key={perm}
                                                    className="p-3
                                                             text-center
                                                             text-gray-700
                                                             font-bold">
                                                    {perm}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MODULES.map(mod => (
                                            <tr key={mod}
                                                className="border-t
                                                         hover:bg-gray-50">
                                                <td className="p-3
                                                             font-bold
                                                             text-gray-700">
                                                    {mod}
                                                </td>
                                                {PERMISSIONS.map(perm => {
                                                    const hasRole =
                                                        roleHasPerm(
                                                            mod, perm);
                                                    const hasIndividual =
                                                        pendingChanges
                                                            [mod]?.[perm];
                                                    return (
                                                        <td key={perm}
                                                            className="p-3
                                                                     text-center">
                                                            <div className="flex
                                                                          flex-col
                                                                          items-center
                                                                          gap-1">
                                                                {/* Role permission indicator */}
                                                                <div className={`w-3 h-3
                                                                    rounded-full
                                                                    ${hasRole
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-gray-200'
                                                                    }`}
                                                                    title={hasRole
                                                                        ? 'Has role permission'
                                                                        : 'No role permission'}>
                                                                </div>
                                                                {/* Individual permission toggle */}
                                                                <button
                                                                    onClick={() =>
                                                                        handleToggle(
                                                                            mod,
                                                                            perm
                                                                        )}
                                                                    className={`w-8 h-8
                                                                        rounded-full
                                                                        font-bold text-sm
                                                                        transition-colors
                                                                        ${hasIndividual
                                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                                                        }`}>
                                                                    {hasIndividual
                                                                        ? '✓' : '✗'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Info Box */}
                                <div className="mt-4 bg-blue-50
                                              rounded p-3 text-sm
                                              text-blue-700">
                                    💡 Blue dot = Role permission
                                    (inherited). Green button =
                                    Individual override (specific
                                    to this user only). Individual
                                    permissions take priority over
                                    role permissions.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}