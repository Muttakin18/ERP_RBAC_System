'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';

const ROLES = ['Admin', 'HR', 'TL', 'Employee'];
const MODULES = ['Shift', 'Designation', 'Department'];
const PERMISSIONS = ['VIEW', 'ADD', 'UPDATE', 'DELETE'];

export default function PermissionsPage() {
    const [matrix, setMatrix] = useState<any>({});
    const [pendingMatrix, setPendingMatrix] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'Admin') {
            window.location.href = '/dashboard';
            return;
        }
        fetchMatrix();
    }, []);

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const newMatrix: any = {};

            for (const role of ROLES) {
                newMatrix[role] = {};
                const res = await api.get(
                    `/api/permissions/role/${role}`);

                for (const mod of MODULES) {
                    newMatrix[role][mod] = {};
                    for (const perm of PERMISSIONS) {
                        newMatrix[role][mod][perm] = false;
                    }
                }

                res.data.forEach((rmp: any) => {
                    const mod = rmp.module.name;
                    const perm = rmp.permission.name;
                    if (newMatrix[role][mod]) {
                        newMatrix[role][mod][perm] = {
                            exists: true,
                            id: rmp.id
                        };
                    }
                });
            }
            setMatrix(newMatrix);
            setPendingMatrix(JSON.parse(
                JSON.stringify(newMatrix)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (
        role: string,
        mod: string,
        perm: string
    ) => {
        const updated = JSON.parse(
            JSON.stringify(pendingMatrix));
        const current = updated[role][mod][perm];

        if (current && current.exists) {
            updated[role][mod][perm] = false;
        } else {
            updated[role][mod][perm] = {
                exists: true,
                pending: true
            };
        }
        setPendingMatrix(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const role of ROLES) {
                for (const mod of MODULES) {
                    for (const perm of PERMISSIONS) {
                        const original = matrix[role][mod][perm];
                        const pending = pendingMatrix[role][mod][perm];

                        const wasActive = original && original.exists;
                        const isActive = pending && pending.exists;

                        if (!wasActive && isActive) {
                            await api.post(
                                '/api/permissions/assign', {
                                role,
                                module: mod,
                                permission: perm,
                            });
                        } else if (wasActive && !isActive) {
                            await api.delete(
                                `/api/permissions/${original.id}`);
                        }
                    }
                }
            }

            setMessage('✅ Permissions saved successfully!');
            setMessageType('success');
            fetchMatrix();
        } catch (err) {
            setMessage('❌ Error saving permissions!');
            setMessageType('error');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleReset = async () => {
    setSaving(true);
    try {
        // Delete all existing permissions from database
        for (const role of ROLES) {
            for (const mod of MODULES) {
                for (const perm of PERMISSIONS) {
                    const current = matrix[role][mod][perm];
                    if (current && current.exists) {
                        await api.delete(
                            `/api/permissions/${current.id}`);
                    }
                }
            }
        }

        // Reset everything to empty
        const emptyMatrix: any = {};
        for (const role of ROLES) {
            emptyMatrix[role] = {};
            for (const mod of MODULES) {
                emptyMatrix[role][mod] = {};
                for (const perm of PERMISSIONS) {
                    emptyMatrix[role][mod][perm] = false;
                }
            }
        }

        setMatrix(emptyMatrix);
        setPendingMatrix(JSON.parse(
            JSON.stringify(emptyMatrix)));
        setMessage('🔄 All permissions have been reset!');
        setMessageType('warning');
    } catch (err) {
        setMessage('❌ Error resetting permissions!');
        setMessageType('error');
    } finally {
        setSaving(false);
        setTimeout(() => setMessage(''), 3000);
    }
};

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 
                           flex items-center justify-center">
                <p className="text-gray-600 text-lg">
                    Loading permissions...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-blue-600 text-white px-6 py-4 
                           flex justify-between items-center">
                <h1 className="text-xl font-bold">
                    🔐 Permission Matrix
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
                    <div className={`p-3 rounded mb-4 font-medium
                        ${messageType === 'success'
                            ? 'bg-green-100 text-green-700'
                            : messageType === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Matrix Table */}
                <div className="bg-white rounded-lg shadow 
                               overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-4 text-left 
                                             text-gray-700 
                                             font-bold">
                                    Role
                                </th>
                                {MODULES.map(mod => (
                                    <th key={mod}
                                        colSpan={4}
                                        className="p-4 text-center 
                                                 text-gray-700 
                                                 font-bold border-l">
                                        {mod}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-50 border-t">
                                <th className="p-3"></th>
                                {MODULES.map(mod =>
                                    PERMISSIONS.map(perm => (
                                        <th key={`${mod}-${perm}`}
                                            className="p-3 text-xs 
                                                     text-gray-500 
                                                     border-l font-medium">
                                            {perm}
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {ROLES.map(role => (
                                <tr key={role}
                                    className="border-t 
                                             hover:bg-gray-50">
                                    <td className="p-4 font-bold 
                                                 text-gray-700">
                                        <span className={`px-3 py-1 
                                            rounded-full text-sm
                                            ${role === 'Admin'
                                                ? 'bg-red-100 text-red-700'
                                                : role === 'HR'
                                                ? 'bg-blue-100 text-blue-700'
                                                : role === 'TL'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                            {role}
                                        </span>
                                    </td>
                                    {MODULES.map(mod =>
                                        PERMISSIONS.map(perm => (
                                            <td key={`${role}-${mod}-${perm}`}
                                                className="p-3 text-center 
                                                         border-l">
                                                <button
                                                    onClick={() =>
                                                        handleToggle(
                                                            role,
                                                            mod,
                                                            perm
                                                        )
                                                    }
                                                    className={`w-8 h-8 
                                                        rounded-full 
                                                        font-bold text-sm
                                                        transition-colors
                                                        ${pendingMatrix[role]?.[mod]?.[perm]?.exists
                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                                        }`}>
                                                    {pendingMatrix[role]?.[mod]?.[perm]?.exists
                                                        ? '✓' : '✗'}
                                                </button>
                                            </td>
                                        ))
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Save and Reset Buttons */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-500 text-white 
                                  px-6 py-2 rounded-lg 
                                  hover:bg-green-600 
                                  disabled:opacity-50 
                                  font-bold text-sm">
                        {saving ? '💾 Saving...' : '💾 Save Changes'}
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="bg-yellow-500 text-white 
                                  px-6 py-2 rounded-lg 
                                  hover:bg-yellow-600 
                                  disabled:opacity-50 
                                  font-bold text-sm">
                        🔄 Reset Changes
                    </button>
                </div>

            </div>
        </div>
    );
}