import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Building2, Key, Copy, Check } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await apiClient.get('/organizations');
      if (res.data?.organizations) setOrgs(res.data.organizations);
    } catch (err) {
      console.warn('Fallback orgs list:', err);
      setOrgs([
        {
          id: 'org-001',
          name: 'Enterprise Cybersecurity Corp',
          plan: 'ENTERPRISE',
          apiKey: 'ds-api-key-live-9920183746192847',
          monthlyScanLimit: 50000,
          scansUsed: 142,
        },
      ]);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold font-display text-white">Multi-Tenant Organizations</h1>
        <p className="text-xs text-slate-400 mt-1">Tenant isolation, license scan quotas, and API access keys</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orgs.map((org) => (
          <div key={org.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 glass-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{org.name}</h3>
                  <span className="text-[10px] text-blue-400 font-semibold">{org.plan} PLAN</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-800 py-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Monthly Scans Used:</span>
                <span className="font-mono font-bold text-white">{org.scansUsed} / {org.monthlyScanLimit}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (org.scansUsed / org.monthlyScanLimit) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                REST API Authentication Key
              </span>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                <Key className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate flex-1">{org.apiKey}</span>
                <button
                  onClick={() => copyToClipboard(org.apiKey)}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedKey === org.apiKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
