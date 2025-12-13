import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { User, UserRole } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Truck,
  Eye,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function UsersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const roleConfig: Record<UserRole, { labelKey: string; color: string; darkColor: string; icon: React.ElementType }> = {
    super_admin: { labelKey: 'role.superAdmin', color: 'bg-purple-100 text-purple-700', darkColor: 'dark:bg-purple-900/50 dark:text-purple-300', icon: Shield },
    fleet_admin: { labelKey: 'role.fleetAdmin', color: 'bg-blue-100 text-blue-700', darkColor: 'dark:bg-blue-900/50 dark:text-blue-300', icon: Settings },
    fleet_manager: { labelKey: 'role.fleetManager', color: 'bg-green-100 text-green-700', darkColor: 'dark:bg-green-900/50 dark:text-green-300', icon: UserCheck },
    fleet_viewer: { labelKey: 'role.fleetViewer', color: 'bg-gray-100 text-gray-700', darkColor: 'dark:bg-slate-700 dark:text-slate-300', icon: Eye },
    driver: { labelKey: 'role.driver', color: 'bg-yellow-100 text-yellow-700', darkColor: 'dark:bg-yellow-900/50 dark:text-yellow-300', icon: Truck },
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getAll();
      return response.data.users;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await usersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const users: User[] = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    role: u.role,
    fleetId: u.fleet_id,
    isActive: u.is_active,
    lastLogin: u.last_login,
    createdAt: u.created_at,
  }));

  const filteredUsers = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) { return false; }
    if (search) {
      const query = search.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {t('users.subtitle')}
          </p>
        </header>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('users.addUser')}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" aria-hidden="true" />
            <input
              id="user-search"
              type="search"
              placeholder="Search users..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              className="input w-full md:w-48"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            >
              <option value="">{t('users.allRoles')}</option>
              {Object.entries(roleConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {t(config.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  User
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Last Login
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div 
                      className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" 
                      role="status"
                      aria-label={t('common.loading')}
                    />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const role = roleConfig[user.role];
                  const RoleIcon = role.icon;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', role.color, role.darkColor)}>
                          <RoleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          {t(role.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                            <UserCheck className="w-4 h-4" aria-hidden="true" />
                            {t('users.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 dark:text-slate-500 text-sm">
                            <UserX className="w-4 h-4" aria-hidden="true" />
                            {t('users.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {user.lastLogin
                          ? format(new Date(user.lastLogin), 'MMM d, yyyy')
                          : 'Never'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
                        <time dateTime={user.createdAt}>
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </time>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={`Edit ${user.firstName} ${user.lastName}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Delete ${user.firstName} ${user.lastName}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
