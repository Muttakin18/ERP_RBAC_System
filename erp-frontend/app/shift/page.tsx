'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
// STATUS-FILTER-START
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants';
// STATUS-FILTER-END

export default function ShiftPage() {
    const [shifts, setShifts] = useState([]);
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    // STATUS-FILTER-START
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    // STATUS-FILTER-END
    const [form, setForm] = useState({
        name: '',
        startTime: '',
        endTime: '',
        description: ''
    });

    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        const storedUsername = localStorage.getItem('username');
        if (!storedRole || !storedUsername) {
            window.location.href = '/login';
            return;
        }
        setRole(storedRole);
        setUsername(storedUsername);
        fetchPermissions(storedRole, storedUsername);
        fetchShifts(storedRole, storedUsername);
    }, []);

    const fetchPermissions = async (
            roleName: string,
            userName: string) => {
        try {
            const roleRes = await api.get(
                `/api/permissions/role/${roleName}`);
            const rolePerms = roleRes.data
                .filter((p: any) => p.module.name === 'Shift')
                .map((p: any) => p.permission.name);

            const individualRes = await api.get(
                `/api/user-permissions/${userName}/individual`);
            const individualPerms = individualRes.data
                .filter((p: any) => p.module.name === 'Shift')
                .map((p: any) => p.permission.name);

            const combined = [...new Set([
                ...rolePerms,
                ...individualPerms
            ])] as string[];

            setPermissions(combined);
        } catch (err) {
            console.error(err);
        }
    };

    // STATUS-FILTER-START
    const fetchShifts = async (
            userRole: string,
            userName: string,
            status?: number | null) => {
        setLoading(true);
        try {
            let res;
            if (userRole === 'Admin' || userRole === 'HR') {
                const params = (status !== null && status !== undefined)
                    ? `?status=${status}`
                    : '';
                res = await api.get(`/api/shifts${params}`);
                setShifts(Array.isArray(res.data) ? res.data : []);
            } else if (userRole === 'TL') {
                res = await api.get(`/api/shifts/team/${userName}`);
                setShifts(Array.isArray(res.data) ? res.data : []);
            } else {
                res = await api.get(`/api/shifts/my/${userName}`);
                if (typeof res.data === 'string') {
                    setShifts([]);
                } else {
                    setShifts([res.data]);
                }
            }
        } catch (err) {
            console.error(err);
            setShifts([]);
        } finally {
            setLoading(false);
        }
    };
    // STATUS-FILTER-END

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(`/api/shifts/${editingId}`, form);
                setMessage('✅ Shift updated successfully!');
            } else {
                await api.post('/api/shifts', form);
                setMessage('✅ Shift created successfully!');
            }
            setMessageType('success');
            setShowForm(false);
            setEditingId(null);
            setForm({
                name: '',
                startTime: '',
                endTime: '',
                description: ''
            });
            // STATUS-FILTER-START
            fetchShifts(role, username, statusFilter);
            // STATUS-FILTER-END
        } catch (err) {
            setMessage('❌ Error saving shift!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEdit = (shift: any) => {
        setEditingId(shift.id);
        setForm({
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: shift.description
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/api/shifts/${id}`);
            setMessage('✅ Shift deleted successfully!');
            setMessageType('success');
            // STATUS-FILTER-START
            fetchShifts(role, username, statusFilter);
            // STATUS-FILTER-END
        } catch (err) {
            setMessage('❌ Error deleting shift!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const hasPermission = (perm: string) =>
        permissions.includes(perm);

    const getShiftObj = (item: any) => {
        return role === 'TL' ? item.shift : item;
    };

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-blue-600 text-white px-6 py-4
                           flex justify-between items-center">
                <h1 className="text-xl font-bold">
                    🕐 Shift Management
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm bg-blue-800
                                   px-3 py-1 rounded-full">
                        {role}
                    </span>
                    <button
                        onClick={() =>
                            window.location.href = '/dashboard'}
                        className="bg-blue-800 px-4 py-1
                                  rounded hover:bg-blue-900">
                        ← Back to Dashboard
                    </button>
                </div>
            </nav>

            <div className="p-6">

                {/* Message */}
                {message && (
                    <div className={`p-3 rounded mb-4 font-medium
                        ${messageType === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Add Button */}
                {hasPermission('ADD') && (
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setEditingId(null);
                            setForm({
                                name: '',
                                startTime: '',
                                endTime: '',
                                description: ''
                            });
                        }}
                        className="bg-green-500 text-white
                                  px-4 py-2 rounded-lg
                                  hover:bg-green-600
                                  font-bold mb-6">
                        ➕ Add New Shift
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg
                                   shadow p-6 mb-6">
                        <h2 className="text-lg font-bold
                                     text-gray-800 mb-4">
                            {editingId ? 'Edit Shift' : 'Add New Shift'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    Shift Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({
                                        ...form, name: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border
                                              border-gray-300 rounded
                                              text-gray-900 bg-white"
                                    placeholder="e.g. Morning Shift"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="text"
                                    value={form.startTime}
                                    onChange={(e) => setForm({
                                        ...form, startTime: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border
                                              border-gray-300 rounded
                                              text-gray-900 bg-white"
                                    placeholder="e.g. 08:00 AM"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    End Time
                                </label>
                                <input
                                    type="text"
                                    value={form.endTime}
                                    onChange={(e) => setForm({
                                        ...form, endTime: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border
                                              border-gray-300 rounded
                                              text-gray-900 bg-white"
                                    placeholder="e.g. 04:00 PM"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({
                                        ...form, description: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border
                                              border-gray-300 rounded
                                              text-gray-900 bg-white"
                                    placeholder="e.g. Regular morning shift"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-500 text-white
                                          px-6 py-2 rounded-lg
                                          hover:bg-blue-600 font-bold">
                                {editingId ? 'Update' : 'Save'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="bg-gray-300 text-gray-700
                                          px-6 py-2 rounded-lg
                                          hover:bg-gray-400 font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Shifts Table */}
                <div className="bg-white rounded-lg shadow p-6">
                    {/* STATUS-FILTER-START */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {role === 'Employee'
                                ? 'My Shift'
                                : role === 'TL'
                                ? 'My Team Shifts'
                                : 'All Shifts'}
                        </h2>
                        {(role === 'Admin' || role === 'HR') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setStatusFilter(null);
                                        fetchShifts(role, username, null);
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        statusFilter === null
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    All
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusFilter(STATUS.ACTIVE);
                                        fetchShifts(role, username, STATUS.ACTIVE);
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        statusFilter === STATUS.ACTIVE
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    ✓ Active
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusFilter(STATUS.INACTIVE);
                                        fetchShifts(role, username, STATUS.INACTIVE);
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        statusFilter === STATUS.INACTIVE
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    ⏸ Inactive
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusFilter(STATUS.DELETED);
                                        fetchShifts(role, username, STATUS.DELETED);
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        statusFilter === STATUS.DELETED
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    🗑 Deleted
                                </button>
                            </div>
                        )}
                    </div>
                    {/* STATUS-FILTER-END */}
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : shifts.length === 0 ? (
                        <p className="text-gray-500">No shifts found!</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    {role === 'TL' && (
                                        <>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Employee
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Role
                                            </th>
                                        </>
                                    )}
                                    {role !== 'TL' && (
                                        <th className="text-left p-3
                                                     text-gray-600">
                                            ID
                                        </th>
                                    )}
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Shift Name
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Start Time
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        End Time
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Description
                                    </th>
                                    {/* STATUS-FILTER-START */}
                                    {role !== 'TL' && (
                                        <th className="text-left p-3
                                                     text-gray-600">
                                            Status
                                        </th>
                                    )}
                                    {/* STATUS-FILTER-END */}
                                    {(hasPermission('UPDATE') ||
                                        hasPermission('DELETE')) && (
                                        <th className="text-left p-3
                                                     text-gray-600">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.map((item: any, index: number) => {
                                    const shift = getShiftObj(item);
                                    return (
                                        <tr key={index}
                                            className="border-t hover:bg-gray-50">
                                            {role === 'TL' && (
                                                <>
                                                    <td className="p-3
                                                                 font-medium
                                                                 text-blue-700">
                                                        👤 {item.username}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1
                                                            rounded-full text-xs
                                                            font-medium
                                                            ${item.role === 'TL (You)'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {item.role}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                            {role !== 'TL' && (
                                                <td className="p-3 text-gray-700">
                                                    {shift.id}
                                                </td>
                                            )}
                                            <td className="p-3 text-gray-700
                                                         font-medium">
                                                {shift.name}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {shift.startTime}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {shift.endTime}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {shift.description}
                                            </td>
                                            {/* STATUS-FILTER-START */}
                                            {role !== 'TL' && (
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        STATUS_COLORS[shift.status] || 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                        {STATUS_LABELS[shift.status] || 'Unknown'}
                                                    </span>
                                                </td>
                                            )}
                                            {/* STATUS-FILTER-END */}
                                            {(hasPermission('UPDATE') ||
                                                hasPermission('DELETE')) && (
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission('UPDATE') && (
                                                            <button
                                                                onClick={() =>
                                                                    handleEdit(shift)}
                                                                className="bg-yellow-500
                                                                          text-white
                                                                          px-3 py-1
                                                                          rounded
                                                                          hover:bg-yellow-600
                                                                          text-sm">
                                                                Edit
                                                            </button>
                                                        )}
                                                        {hasPermission('DELETE') && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(shift.id)}
                                                                className="bg-red-500
                                                                          text-white
                                                                          px-3 py-1
                                                                          rounded
                                                                          hover:bg-red-600
                                                                          text-sm">
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}