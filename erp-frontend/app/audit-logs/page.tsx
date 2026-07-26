'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'Admin') {
            window.location.href = '/dashboard';
            return;
        }
        fetchLogs();
    }, []);

    const fetchLogs = async (
        module = '',
        action = '',
        from = '',
        to = ''
    ) => {
        setLoading(true);
        setError('');
        try {
            let url = '/api/audit-logs';
            const params = new URLSearchParams();

            // Date range takes priority
            if (from && to) {
                url = '/api/audit-logs/date-range';
                params.append('from', from);
                params.append('to', to);
            } else if (module && action) {
                url = '/api/audit-logs/filter';
                params.append('module', module);
                params.append('action', action);
            } else if (module) {
                url = `/api/audit-logs/module/${module}`;
            } else if (action) {
                url = `/api/audit-logs/action/${action}`;
            }

            const queryString = params.toString();
            const res = await api.get(
                queryString ? `${url}?${queryString}` : url
            );
            setLogs(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error(err);
            setError(
                'Failed to fetch audit logs. Make sure the backend is running.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (module: string, action: string) => {
        setSelectedModule(module);
        setSelectedAction(action);
        setDateFrom('');
        setDateTo('');
        fetchLogs(module, action, '', '');
    };

    const handleDateFilter = () => {
        if (!dateFrom || !dateTo) return;
        setSelectedModule('');
        setSelectedAction('');
        fetchLogs('', '', dateFrom, dateTo);
    };

    const handleClearFilters = () => {
        setSelectedModule('');
        setSelectedAction('');
        setSearchUser('');
        setDateFrom('');
        setDateTo('');
        fetchLogs('', '', '', '');
    };

    // Client-side filter for username search
    const filteredLogs = logs.filter((log: any) => {
        if (!searchUser) return true;
        return log.performedBy
            .toLowerCase()
            .includes(searchUser.toLowerCase());
    });

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch (e) {
            return dateStr;
        }
    };

    const actionConfig: Record<
        string,
        { bg: string; text: string; border: string; icon: string }
    > = {
        CREATE: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            icon: '✚',
        },
        UPDATE: {
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200',
            icon: '✎',
        },
        DELETE: {
            bg: 'bg-rose-50',
            text: 'text-rose-700',
            border: 'border-rose-200',
            icon: '✕',
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

            {/* Header / Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white px-6 py-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Audit Logs
                        </h1>
                        <p className="text-indigo-200 text-xs mt-0.5">
                            Track every change across all modules
                        </p>
                    </div>
                </div>
                <button
                    id="btn-back-to-dashboard"
                    onClick={() =>
                        (window.location.href = '/dashboard')
                    }
                    className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
            </nav>

            <div className="p-6 max-w-7xl mx-auto">

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        {
                            label: 'Total Logs',
                            value: filteredLogs.length,
                            color: 'text-slate-900',
                            icon: '📊',
                            bg: 'from-slate-50 to-slate-100',
                        },
                        {
                            label: 'Creations',
                            value: filteredLogs.filter(
                                (l) => l.action === 'CREATE'
                            ).length,
                            color: 'text-emerald-600',
                            icon: '✚',
                            bg: 'from-emerald-50 to-green-100',
                        },
                        {
                            label: 'Updates',
                            value: filteredLogs.filter(
                                (l) => l.action === 'UPDATE'
                            ).length,
                            color: 'text-amber-600',
                            icon: '✎',
                            bg: 'from-amber-50 to-yellow-100',
                        },
                        {
                            label: 'Deletions',
                            value: filteredLogs.filter(
                                (l) => l.action === 'DELETE'
                            ).length,
                            color: 'text-rose-600',
                            icon: '✕',
                            bg: 'from-rose-50 to-red-100',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className={`bg-gradient-to-br ${stat.bg} p-5 rounded-2xl shadow-sm border border-white flex items-center gap-4`}
                        >
                            <span className="text-2xl">
                                {stat.icon}
                            </span>
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                    {stat.label}
                                </p>
                                <p
                                    className={`text-2xl font-bold ${stat.color} mt-0.5`}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            🔍 Search & Filters
                        </h2>
                        <button
                            id="btn-clear-filters"
                            onClick={handleClearFilters}
                            className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Module selector */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 mb-1.5">
                                Module
                            </label>
                            <select
                                id="filter-module"
                                value={selectedModule}
                                onChange={(e) =>
                                    handleFilterChange(
                                        e.target.value,
                                        selectedAction
                                    )
                                }
                                className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                                <option value="">All Modules</option>
                                <option value="Shift">Shift</option>
                                <option value="Department">Department</option>
                                <option value="Designation">Designation</option>
                                <option value="User">User</option>
                            </select>
                        </div>

                        {/* Action selector */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 mb-1.5">
                                Action
                            </label>
                            <select
                                id="filter-action"
                                value={selectedAction}
                                onChange={(e) =>
                                    handleFilterChange(
                                        selectedModule,
                                        e.target.value
                                    )
                                }
                                className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>

                        {/* Search by user */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 mb-1.5">
                                Performed By (User)
                            </label>
                            <div className="relative">
                                <input
                                    id="filter-user"
                                    type="text"
                                    value={searchUser}
                                    onChange={(e) =>
                                        setSearchUser(e.target.value)
                                    }
                                    placeholder="Search by username..."
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                                    👤
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
                            📅 Filter by Date Range
                        </p>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-slate-500 mb-1.5">
                                    From
                                </label>
                                <input
                                    id="filter-date-from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-slate-500 mb-1.5">
                                    To
                                </label>
                                <input
                                    id="filter-date-to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) =>
                                        setDateTo(e.target.value)
                                    }
                                    className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <button
                                id="btn-apply-date-filter"
                                onClick={handleDateFilter}
                                disabled={!dateFrom || !dateTo}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Apply Date Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-sm flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold">{error}</p>
                            <p className="text-xs text-red-500 mt-0.5">
                                Please check if your Spring Boot backend
                                service is running on port 8080.
                            </p>
                        </div>
                    </div>
                )}

                {/* Audit Logs Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            📜 Activity History
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                            {filteredLogs.length} entries
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-500 text-sm mt-4 font-medium">
                                Fetching change logs...
                            </p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-24 text-center flex flex-col items-center">
                            <span className="text-5xl text-slate-200">📭</span>
                            <h3 className="font-bold text-slate-600 text-lg mt-4">
                                No audit logs found
                            </h3>
                            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                                Try adjusting your filters or verify
                                if any actions have been performed.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                                            Action
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">
                                            Module
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">
                                            Record
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                                            Field Changed
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Old Value
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            New Value
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">
                                            Performed By
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">
                                            Performed At
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(
                                        (log: any, idx: number) => {
                                            const cfg =
                                                actionConfig[
                                                    log.action
                                                ] ||
                                                actionConfig['UPDATE'];
                                            return (
                                                <tr
                                                    key={log.id}
                                                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-sm ${
                                                        idx % 2 === 0
                                                            ? 'bg-white'
                                                            : 'bg-slate-50/30'
                                                    }`}
                                                >
                                                    {/* Action Badge */}
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                                        >
                                                            <span>
                                                                {cfg.icon}
                                                            </span>
                                                            {log.action}
                                                        </span>
                                                    </td>

                                                    {/* Module */}
                                                    <td className="p-4">
                                                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                                            {log.module}
                                                        </span>
                                                    </td>

                                                    {/* Record */}
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">
                                                                {log.recordName ||
                                                                    '-'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                ID:{' '}
                                                                {log.recordId ||
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Field Name */}
                                                    <td className="p-4">
                                                        {log.fieldName &&
                                                        log.fieldName !==
                                                            '-' ? (
                                                            <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono font-bold border border-indigo-100">
                                                                {
                                                                    log.fieldName
                                                                }
                                                            </code>
                                                        ) : (
                                                            <span className="text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Old Value */}
                                                    <td
                                                        className="p-4 max-w-[160px] truncate"
                                                        title={log.oldValue}
                                                    >
                                                        {log.oldValue &&
                                                        log.oldValue !==
                                                            '-' ? (
                                                            <span className="bg-rose-50 text-rose-600 line-through px-1.5 py-0.5 rounded text-xs border border-rose-100">
                                                                {log.oldValue}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* New Value */}
                                                    <td
                                                        className="p-4 max-w-[160px] truncate"
                                                        title={log.newValue}
                                                    >
                                                        {log.newValue &&
                                                        log.newValue !==
                                                            '-' ? (
                                                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xs border border-emerald-100 font-medium">
                                                                {log.newValue}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Performed By */}
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                                                                {log.performedBy?.[0] ||
                                                                    '?'}
                                                            </span>
                                                            <span className="font-medium text-slate-700 text-xs">
                                                                {
                                                                    log.performedBy
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Performed At */}
                                                    <td className="p-4 text-slate-400 font-medium whitespace-nowrap text-xs">
                                                        {formatDateTime(
                                                            log.performedAt
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
