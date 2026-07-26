'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
// STATUS-FILTER-START
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants';
// STATUS-FILTER-END

export default function DesignationPage() {
    const [designations, setDesignations] = useState([]);
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isTLView, setIsTLView] = useState(false);
    const [allDesignations, setAllDesignations] = useState<any[]>([]);
    const [showEditMember, setShowEditMember] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [memberDesignationId, setMemberDesignationId] = useState('');
    // STATUS-FILTER-START
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    // STATUS-FILTER-END
    const [form, setForm] = useState({
        name: '',
        description: '',
        department: ''
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
        setIsTLView(storedRole === 'TL');
        fetchPermissions(storedRole, storedUsername);
        fetchDesignations(storedRole, storedUsername);
        if (storedRole === 'TL') {
            fetchAllDesignations();
        }
    }, []);

    const fetchPermissions = async (
            roleName: string,
            userName: string) => {
        try {
            const roleRes = await api.get(
                `/api/permissions/role/${roleName}`);
            const rolePerms = roleRes.data
                .filter((p: any) => p.module.name === 'Designation')
                .map((p: any) => p.permission.name);

            const individualRes = await api.get(
                `/api/user-permissions/${userName}/individual`);
            const individualPerms = individualRes.data
                .filter((p: any) => p.module.name === 'Designation')
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

    const fetchAllDesignations = async () => {
        try {
            const res = await api.get('/api/designations');
            setAllDesignations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // STATUS-FILTER-START
    const fetchDesignations = async (
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
                res = await api.get(`/api/designations${params}`);
                setDesignations(Array.isArray(res.data) ? res.data : []);
            } else if (userRole === 'TL') {
                res = await api.get(
                    `/api/designations/team/${userName}`);
                setDesignations(Array.isArray(res.data) ? res.data : []);
            } else {
                res = await api.get(
                    `/api/designations/my/${userName}`);
                if (typeof res.data === 'string') {
                    setDesignations([]);
                } else {
                    setDesignations([res.data]);
                }
            }
        } catch (err) {
            console.error(err);
            setDesignations([]);
        } finally {
            setLoading(false);
        }
    };
    // STATUS-FILTER-END

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(
                    `/api/designations/${editingId}`, form);
                setMessage('✅ Designation updated successfully!');
            } else {
                await api.post('/api/designations', form);
                setMessage('✅ Designation created successfully!');
            }
            setMessageType('success');
            setShowForm(false);
            setEditingId(null);
            setForm({ name: '', description: '', department: '' });
            // STATUS-FILTER-START
            fetchDesignations(role, username, statusFilter);
            // STATUS-FILTER-END
        } catch (err) {
            setMessage('❌ Error saving designation!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEdit = (designation: any) => {
        setEditingId(designation.id);
        setForm({
            name: designation.name,
            description: designation.description,
            department: designation.department
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/api/designations/${id}`);
            setMessage('✅ Designation deleted successfully!');
            setMessageType('success');
            // STATUS-FILTER-START
            fetchDesignations(role, username, statusFilter);
            // STATUS-FILTER-END
        } catch (err) {
            setMessage('❌ Error deleting designation!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEditMember = (member: any) => {
        setEditingMember(member);
        setMemberDesignationId('');
        setShowEditMember(true);
    };

    const handleSaveMember = async () => {
        try {
            const userRes = await api.get(
                `/api/users/username/${editingMember.username}`);
            const memberId = userRes.data.id;

            if (memberDesignationId) {
                await api.put(
                    `/api/users/${memberId}/assign-designation`,
                    { designationId: parseInt(memberDesignationId) }
                );
            }

            setMessage('✅ Designation updated successfully!');
            setMessageType('success');
            setShowEditMember(false);
            setEditingMember(null);
            fetchDesignations(role, username, statusFilter);
        } catch (err) {
            setMessage('❌ Error updating designation!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const hasPermission = (perm: string) =>
        permissions.includes(perm);

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-green-600 text-white px-6 py-4
                           flex justify-between items-center">
                <h1 className="text-xl font-bold">
                    👔 Designation Management
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm bg-green-800
                                   px-3 py-1 rounded-full">
                        {role}
                    </span>
                    <button
                        onClick={() =>
                            window.location.href = '/dashboard'}
                        className="bg-green-800 px-4 py-1
                                  rounded hover:bg-green-900">
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
                                description: '',
                                department: ''
                            });
                        }}
                        className="bg-green-500 text-white
                                  px-4 py-2 rounded-lg
                                  hover:bg-green-600
                                  font-bold mb-6">
                        ➕ Add New Designation
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg
                                   shadow p-6 mb-6">
                        <h2 className="text-lg font-bold
                                     text-gray-800 mb-4">
                            {editingId
                                ? 'Edit Designation'
                                : 'Add New Designation'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    Designation Name
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
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700
                                                text-sm font-bold mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={form.department}
                                    onChange={(e) => setForm({
                                        ...form, department: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border
                                              border-gray-300 rounded
                                              text-gray-900 bg-white"
                                    placeholder="e.g. Engineering"
                                />
                            </div>
                            <div className="col-span-2">
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
                                    placeholder="e.g. Develops software"
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

                {/* Designations Table */}
                <div className="bg-white rounded-lg shadow p-6">
                    {/* STATUS-FILTER-START */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {role === 'Employee'
                                ? 'My Designation'
                                : role === 'TL'
                                ? 'My Team Designations'
                                : 'All Designations'}
                        </h2>
                        {(role === 'Admin' || role === 'HR') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setStatusFilter(null);
                                        fetchDesignations(role, username, null);
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
                                        fetchDesignations(role, username, STATUS.ACTIVE);
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
                                        fetchDesignations(role, username, STATUS.INACTIVE);
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
                                        fetchDesignations(role, username, STATUS.DELETED);
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
                    ) : designations.length === 0 ? (
                        <p className="text-gray-500">No designations found!</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    {isTLView ? (
                                        <>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Employee
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Role
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Designation
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Department
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Description
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Actions
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                ID
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Name
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Department
                                            </th>
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Description
                                            </th>
                                            {/* STATUS-FILTER-START */}
                                            <th className="text-left p-3
                                                         text-gray-600">
                                                Status
                                            </th>
                                            {/* STATUS-FILTER-END */}
                                            {(hasPermission('UPDATE') ||
                                                hasPermission('DELETE')) && (
                                                <th className="text-left p-3
                                                             text-gray-600">
                                                    Actions
                                                </th>
                                            )}
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {isTLView ? (
                                    designations.map((item: any,
                                            index: number) => (
                                        <tr key={index}
                                            className="border-t
                                                     hover:bg-gray-50">
                                            <td className="p-3 font-medium
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
                                            <td className="p-3 text-gray-700
                                                         font-medium">
                                                {item.designation?.name
                                                    || 'Not assigned'}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {item.designation?.department
                                                    || '-'}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {item.designation?.description
                                                    || '-'}
                                            </td>
                                            <td className="p-3">
                                                {item.role !== 'TL (You)' && (
                                                    <button
                                                        onClick={() =>
                                                            handleEditMember(item)}
                                                        className="bg-yellow-500
                                                                  text-white
                                                                  px-3 py-1
                                                                  rounded
                                                                  hover:bg-yellow-600
                                                                  text-sm">
                                                        ✏️ Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    designations.map((d: any) => (
                                        <tr key={d.id}
                                            className="border-t
                                                     hover:bg-gray-50">
                                            <td className="p-3 text-gray-700">
                                                {d.id}
                                            </td>
                                            <td className="p-3 text-gray-700
                                                         font-medium">
                                                {d.name}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {d.department}
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {d.description}
                                            </td>
                                            {/* STATUS-FILTER-START */}
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    STATUS_COLORS[d.status] || 'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {STATUS_LABELS[d.status] || 'Unknown'}
                                                </span>
                                            </td>
                                            {/* STATUS-FILTER-END */}
                                            {(hasPermission('UPDATE') ||
                                                hasPermission('DELETE')) && (
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission('UPDATE') && (
                                                            <button
                                                                onClick={() =>
                                                                    handleEdit(d)}
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
                                                                    handleDelete(d.id)}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit Member Designation Modal */}
            {showEditMember && editingMember && (
                <div className="fixed inset-0 bg-black
                               bg-opacity-50 flex items-center
                               justify-center z-50">
                    <div className="bg-white rounded-lg
                                   shadow-xl p-6 w-96">
                        <h2 className="text-lg font-bold
                                     text-gray-800 mb-4">
                            ✏️ Edit {editingMember.username}
                        </h2>
                        <div className="bg-gray-50 rounded
                                      p-3 mb-4 text-sm">
                            <p className="text-gray-600">
                                Current Designation:
                                <span className="font-medium
                                               text-gray-800 ml-1">
                                    {editingMember.designation?.name
                                        || 'Not assigned'}
                                </span>
                            </p>
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700
                                            text-sm font-bold mb-2">
                                New Designation
                            </label>
                            <select
                                value={memberDesignationId}
                                onChange={(e) =>
                                    setMemberDesignationId(e.target.value)}
                                className="w-full px-3 py-2 border
                                          border-gray-300 rounded
                                          text-gray-900 bg-white">
                                <option value="">
                                    -- Keep Current --
                                </option>
                                {allDesignations.map((d: any) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} - {d.department}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveMember}
                                className="bg-green-500 text-white
                                          px-6 py-2 rounded-lg
                                          hover:bg-green-600 font-bold">
                                💾 Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditMember(false);
                                    setEditingMember(null);
                                }}
                                className="bg-gray-300 text-gray-700
                                          px-6 py-2 rounded-lg
                                          hover:bg-gray-400 font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}