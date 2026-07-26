'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants';

export default function DepartmentPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [allShifts, setAllShifts] = useState<any[]>([]);
    const [allDesignations, setAllDesignations] = useState<any[]>([]);
    const [showEditMember, setShowEditMember] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [memberForm, setMemberForm] = useState({
        shiftId: '',
        designationId: ''
    });
    const [form, setForm] = useState({
        name: '',
        description: '',
        manager: ''
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
        fetchDepartments(storedRole, storedUsername);
        if (storedRole === 'TL') {
            fetchAllShifts();
            fetchAllDesignations();
        }
    }, []);

    const fetchPermissions = async (
            roleName: string,
            userName: string) => {
        try {
            // Get role permissions
            const roleRes = await api.get(
                `/api/permissions/role/${roleName}`);
            const rolePerms = roleRes.data
                .filter((p: any) =>
                    p.module.name === 'Department')
                .map((p: any) => p.permission.name);

            // Get individual permissions
            const individualRes = await api.get(
                `/api/user-permissions/${userName}/individual`);
            const individualPerms = individualRes.data
                .filter((p: any) =>
                    p.module.name === 'Department')
                .map((p: any) => p.permission.name);

            // Combine both
            const combined = [...new Set([
                ...rolePerms,
                ...individualPerms
            ])] as string[];

            setPermissions(combined);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAllShifts = async () => {
        try {
            const res = await api.get('/api/shifts');
            setAllShifts(res.data);
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

    const fetchDepartments = async (
            userRole: string,
            userName: string,
            status?: number | null) => {
        setLoading(true);
        try {
            let res;
            if (userRole === 'Admin' ||
                userRole === 'HR') {
                const params = (status !== null && 
                status !== undefined)
                ? `?status=${status}` 
                : '';
                res = await api.get(`/api/departments${params}`);
                setDepartments(Array.isArray(res.data)
                    ? res.data : []);
                setTeamInfo(null);
            } else if (userRole === 'TL') {
                res = await api.get(
                    `/api/departments/team/${userName}`);
                setTeamInfo(res.data);
                if (res.data.department) {
                    setDepartments([res.data.department]);
                } else {
                    setDepartments([]);
                }
            } else {
                res = await api.get(
                    `/api/departments/my/${userName}`);
                if (typeof res.data === 'string') {
                    setDepartments([]);
                    setTeamInfo(null);
                } else {
                    setTeamInfo(res.data);
                    if (res.data.department) {
                        setDepartments(
                            [res.data.department]);
                    } else {
                        setDepartments([]);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(
                    `/api/departments/${editingId}`,
                    form);
                setMessage(
                    '✅ Department updated successfully!');
            } else {
                await api.post('/api/departments', form);
                setMessage(
                    '✅ Department created successfully!');
            }
            setMessageType('success');
            setShowForm(false);
            setEditingId(null);
            setForm({
                name: '',
                description: '',
                manager: ''
            });
            fetchDepartments(role, username);
        } catch (err) {
            setMessage('❌ Error saving department!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEdit = (department: any) => {
        setEditingId(department.id);
        setForm({
            name: department.name,
            description: department.description,
            manager: department.manager
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/api/departments/${id}`);
            setMessage(
                '✅ Department deleted successfully!');
            setMessageType('success');
            fetchDepartments(role, username);
        } catch (err) {
            setMessage('❌ Error deleting department!');
            setMessageType('error');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEditMember = (member: any) => {
        setEditingMember(member);
        setMemberForm({
            shiftId: '',
            designationId: ''
        });
        setShowEditMember(true);
    };

    const handleSaveMember = async () => {
        try {
            const userRes = await api.get(
                `/api/users/username/${editingMember.username}`);
            const memberId = userRes.data.id;

            if (memberForm.shiftId) {
                await api.put(
                    `/api/users/${memberId}/assign-shift`,
                    { shiftId: parseInt(memberForm.shiftId) }
                );
            }

            if (memberForm.designationId) {
                await api.put(
                    `/api/users/${memberId}/assign-designation`,
                    { designationId: parseInt(
                        memberForm.designationId) }
                );
            }

            setMessage(
                '✅ Team member updated successfully!');
            setMessageType('success');
            setShowEditMember(false);
            setEditingMember(null);
            fetchDepartments(role, username);
        } catch (err) {
            setMessage('❌ Error updating team member!');
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
            <nav className="bg-purple-600 text-white px-6 py-4
                           flex justify-between items-center">
                <h1 className="text-xl font-bold">
                    🏢 Department Management
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm bg-purple-800
                                   px-3 py-1 rounded-full">
                        {role}
                    </span>
                    <button
                        onClick={() =>
                            window.location.href = '/dashboard'}
                        className="bg-purple-800 px-4 py-1
                                  rounded hover:bg-purple-900">
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

                {/* Team Info Card */}
                {teamInfo && (
                    <div className="bg-white rounded-lg
                                   shadow p-6 mb-6">
                        <h2 className="text-lg font-bold
                                     text-gray-800 mb-4">
                            👥 Team Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">

                            {/* Team Leader */}
                            {teamInfo.teamLeader && (
                                <div className="bg-blue-50
                                              rounded p-4">
                                    <p className="text-sm
                                                text-gray-500
                                                mb-2">
                                        Team Leader
                                    </p>
                                    <p className="font-bold
                                                text-blue-700
                                                text-lg">
                                        👤 {teamInfo.teamLeader}
                                    </p>
                                </div>
                            )}

                            {/* Teammates - Employee view */}
                            {teamInfo.teammates &&
                                teamInfo.teammates.length > 0 && (
                                <div className="bg-green-50
                                              rounded p-4">
                                    <p className="text-sm
                                                text-gray-500
                                                mb-2">
                                        Teammates
                                    </p>
                                    {teamInfo.teammates.map(
                                        (t: any, i: number) => (
                                        <div key={i}
                                             className="mb-2
                                                      border-b pb-2">
                                            <p className="font-medium
                                                        text-green-700">
                                                👤 {t.username}
                                            </p>
                                            <p className="text-xs
                                                        text-gray-500">
                                                {t.designation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Team Members - TL view */}
                            {teamInfo.teamMembers &&
                                teamInfo.teamMembers.length > 0 && (
                                <div className="bg-green-50
                                              rounded p-4
                                              col-span-2">
                                    <p className="text-sm
                                                text-gray-500
                                                mb-3 font-bold">
                                        Team Members
                                    </p>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-green-100">
                                                <th className="text-left
                                                             p-2 text-sm
                                                             text-gray-600">
                                                    Name
                                                </th>
                                                <th className="text-left
                                                             p-2 text-sm
                                                             text-gray-600">
                                                    Designation
                                                </th>
                                                <th className="text-left
                                                             p-2 text-sm
                                                             text-gray-600">
                                                    Shift
                                                </th>
                                                <th className="text-left
                                                             p-2 text-sm
                                                             text-gray-600">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teamInfo.teamMembers.map(
                                                (t: any, i: number) => (
                                                <tr key={i}
                                                    className="border-t
                                                             hover:bg-green-50">
                                                    <td className="p-2
                                                                 font-medium
                                                                 text-green-700">
                                                        👤 {t.username}
                                                    </td>
                                                    <td className="p-2
                                                                 text-gray-600
                                                                 text-sm">
                                                        {t.designation}
                                                    </td>
                                                    <td className="p-2
                                                                 text-gray-600
                                                                 text-sm">
                                                        {t.shift}
                                                    </td>
                                                    <td className="p-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEditMember(t)}
                                                            className="bg-yellow-500
                                                                      text-white
                                                                      px-3 py-1
                                                                      rounded
                                                                      hover:bg-yellow-600
                                                                      text-sm">
                                                            ✏️ Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
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
                                manager: ''
                            });
                        }}
                        className="bg-purple-500 text-white
                                  px-4 py-2 rounded-lg
                                  hover:bg-purple-600
                                  font-bold mb-6">
                        ➕ Add New Department
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg
                                   shadow p-6 mb-6">
                        <h2 className="text-lg font-bold
                                     text-gray-800 mb-4">
                            {editingId
                                ? 'Edit Department'
                                : 'Add New Department'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block
                                                text-gray-700
                                                text-sm
                                                font-bold mb-2">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({
                                        ...form,
                                        name: e.target.value
                                    })}
                                    className="w-full px-3 py-2
                                              border border-gray-300
                                              rounded text-gray-900
                                              bg-white"
                                    placeholder="e.g. Engineering"
                                />
                            </div>
                            <div>
                                <label className="block
                                                text-gray-700
                                                text-sm
                                                font-bold mb-2">
                                    Manager
                                </label>
                                <input
                                    type="text"
                                    value={form.manager}
                                    onChange={(e) => setForm({
                                        ...form,
                                        manager: e.target.value
                                    })}
                                    className="w-full px-3 py-2
                                              border border-gray-300
                                              rounded text-gray-900
                                              bg-white"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block
                                                text-gray-700
                                                text-sm
                                                font-bold mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({
                                        ...form,
                                        description: e.target.value
                                    })}
                                    className="w-full px-3 py-2
                                              border border-gray-300
                                              rounded text-gray-900
                                              bg-white"
                                    placeholder="e.g. Handles engineering"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-500 text-white
                                          px-6 py-2 rounded-lg
                                          hover:bg-blue-600
                                          font-bold">
                                {editingId ? 'Update' : 'Save'}
                            </button>
                            <button
                                onClick={() =>
                                    setShowForm(false)}
                                className="bg-gray-300 text-gray-700
                                          px-6 py-2 rounded-lg
                                          hover:bg-gray-400
                                          font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Departments Table */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold
                                     text-gray-800">
                            {role === 'Employee'
                                ? 'My Department'
                                : role === 'TL'
                                ? 'My Team Department'
                                : 'All Departments'}
                        </h2>
                        {(role === 'Admin' || role === 'HR') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setStatusFilter(null);
                                        fetchDepartments(role, username, null);
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
                                        fetchDepartments(role, username, STATUS.ACTIVE);
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
                                        fetchDepartments(role, username, STATUS.INACTIVE);
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
                                        fetchDepartments(role, username, STATUS.DELETED);
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
                    {loading ? (
                        <p className="text-gray-500">
                            Loading...
                        </p>
                    ) : departments.length === 0 ? (
                        <p className="text-gray-500">
                            No departments found!
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
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
                                        Manager
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Description
                                    </th>
                                    <th className="text-left p-3
                                                 text-gray-600">
                                        Status
                                    </th>
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
                                {departments.map((d: any) => (
                                    <tr key={d.id}
                                        className="border-t
                                                 hover:bg-gray-50">
                                        <td className="p-3
                                                     text-gray-700">
                                            {d.id}
                                        </td>
                                        <td className="p-3
                                                     text-gray-700
                                                     font-medium">
                                            {d.name}
                                        </td>
                                        <td className="p-3
                                                     text-gray-700">
                                            {d.manager}
                                        </td>
                                        <td className="p-3
                                                     text-gray-700">
                                            {d.description}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                STATUS_COLORS[d.status] || 'bg-gray-200 text-gray-700'
                                            }`}>
                                                {STATUS_LABELS[d.status] || 'Unknown'}
                                            </span>
                                        </td>
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
                                                                handleDelete(
                                                                    d.id)}
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit Team Member Modal */}
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
                                Current Shift:
                                <span className="font-medium
                                               text-gray-800 ml-1">
                                    {editingMember.shift}
                                </span>
                            </p>
                            <p className="text-gray-600 mt-1">
                                Current Designation:
                                <span className="font-medium
                                               text-gray-800 ml-1">
                                    {editingMember.designation}
                                </span>
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700
                                            text-sm font-bold mb-2">
                                New Shift
                            </label>
                            <select
                                value={memberForm.shiftId}
                                onChange={(e) => setMemberForm({
                                    ...memberForm,
                                    shiftId: e.target.value
                                })}
                                className="w-full px-3 py-2 border
                                          border-gray-300 rounded
                                          text-gray-900 bg-white">
                                <option value="">
                                    -- Keep Current --
                                </option>
                                {allShifts.map((s: any) => (
                                    <option
                                        key={s.id}
                                        value={s.id}>
                                        {s.name} ({s.startTime}
                                        - {s.endTime})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700
                                            text-sm font-bold mb-2">
                                New Designation
                            </label>
                            <select
                                value={memberForm.designationId}
                                onChange={(e) => setMemberForm({
                                    ...memberForm,
                                    designationId: e.target.value
                                })}
                                className="w-full px-3 py-2 border
                                          border-gray-300 rounded
                                          text-gray-900 bg-white">
                                <option value="">
                                    -- Keep Current --
                                </option>
                                {allDesignations.map((d: any) => (
                                    <option
                                        key={d.id}
                                        value={d.id}>
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
                                          hover:bg-green-600
                                          font-bold">
                                💾 Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditMember(false);
                                    setEditingMember(null);
                                }}
                                className="bg-gray-300 text-gray-700
                                          px-6 py-2 rounded-lg
                                          hover:bg-gray-400
                                          font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}