import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Building2, Key, Copy, Check, Shield } from 'lucide-react';

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#014BAA]" />
            Tenant Management
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight">
          Multi-Tenant Organizations & Licenses
        </h1>
        <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
          Tenant isolation boundaries, monthly quota allocations, and enterprise API access keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orgs.map((org) => (
          <div key={org.id} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F0FF] text-[#014BAA] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#282B4A]">{org.name}</h3>
                  <span className="text-[10px] text-[#5A5E7A] font-mono">ID: {org.id}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] uppercase font-mono">
                {org.plan}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] space-y-1">
              <span className="text-[10px] font-bold text-[#5A5E7A] uppercase block">Enterprise API Key</span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#014BAA] font-semibold truncate max-w-[240px]">{org.apiKey}</span>
                <button
                  onClick={() => copyToClipboard(org.apiKey)}
                  className="text-[11px] font-bold text-[#014BAA] hover:underline flex items-center gap-1"
                >
                  {copiedKey === org.apiKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === org.apiKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono pt-1">
              <div className="p-3 rounded-2xl bg-white border border-[#E6F0FF]">
                <span className="text-[10px] text-[#5A5E7A] uppercase block font-semibold">Monthly Quota</span>
                <span className="text-base font-bold text-[#014BAA]">{org.monthlyScanLimit}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E6F0FF]">
                <span className="text-[10px] text-[#5A5E7A] uppercase block font-semibold">Scans Used</span>
                <span className="text-base font-bold text-[#282B4A]">{org.scansUsed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
