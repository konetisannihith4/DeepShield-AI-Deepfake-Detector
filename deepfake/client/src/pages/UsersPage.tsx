import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Mail, User, ShieldCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'ANALYST' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      if (res.data?.users) setUsers(res.data.users);
    } catch (err) {
      setUsers([
        { id: 'u-1', email: 'admin@deepshield.ai', fullName: 'Alex Vance', role: 'ADMIN', isActive: true, createdAt: new Date().toISOString() },
        { id: 'u-2', email: 'analyst@deepshield.ai', fullName: 'Dr. Sarah Connor', role: 'ANALYST', isActive: true, createdAt: new Date().toISOString() },
      ]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', formData);
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#014BAA]" />
              RBAC Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Manage authorized forensic analysts, investigators, and system administrators.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014BAA] hover:bg-[#013D8B] text-white shadow-royal transition-all flex items-center gap-2 self-start sm:self-auto uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-[#E6F0FF] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E6F0FF] text-[#014BAA] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#BFDAFE]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0FF]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8F3F0] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#282B4A]">{u.fullName}</td>
                  <td className="py-3.5 px-4 text-[#5A5E7A] font-mono">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] uppercase font-mono">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#5A5E7A] text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-extrabold text-[#014BAA]">Add Security User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#282B4A] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F0FF]"
                />
              </div>
              <div>
                <label className="font-bold text-[#282B4A] block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F0FF]"
                />
              </div>
              <div>
                <label className="font-bold text-[#282B4A] block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F0FF]"
                />
              </div>
              <div>
                <label className="font-bold text-[#282B4A] block mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F0FF]"
                >
                  <option value="ANALYST">Analyst</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="VIEWER">Auditor / Viewer</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5D8D0] text-[#5A5E7A] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#014BAA] text-white font-extrabold shadow-royal"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
