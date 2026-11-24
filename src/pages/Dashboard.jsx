import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import { Building2, Users, GraduationCap, CheckCircle, Ban, Layers, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/super-admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-500/30 inline-block mb-3">
            Super Admin Control Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Multi-School Operations & SaaS Overview
          </h2>
          <p className="text-slate-300 text-sm mt-2">
            Monitor real-time institutional accounts, active subscription validity (daily, weekly, monthly, quarterly, yearly), and block or approve school access across the network.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Schools"
          value={stats?.totalSchools || 0}
          icon={Building2}
          color="brand"
          subtitle="Registered institutions"
        />
        <StatsCard
          title="Active Schools"
          value={stats?.activeSchools || 0}
          icon={CheckCircle}
          color="emerald"
          subtitle="Operating normally"
        />
        <StatsCard
          title="Blocked Schools"
          value={stats?.blockedSchools || 0}
          icon={Ban}
          color="rose"
          subtitle="Suspended or blocked"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon={Layers}
          color="blue"
          subtitle="Valid billing cycles"
        />
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatsCard
          title="Total Students Enrolled"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          color="emerald"
          subtitle="Across all affiliated schools"
        />
        <StatsCard
          title="Total Faculty & Staff"
          value={stats?.totalStaff || 0}
          icon={Users}
          color="amber"
          subtitle="Teachers, HODs, & administrative staff"
        />
      </div>

      {/* Recent Schools Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recently Registered Schools</h3>
            <p className="text-xs text-slate-500">Latest tenant schools registered on the ERP network</p>
          </div>
          <Link
            to="/schools"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Manage All Schools &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">School Name</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Email / Phone</th>
                <th className="px-6 py-3.5">Active Plan</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentSchools?.map((school) => {
                const sub = school.subscriptions?.[0];
                return (
                  <tr key={school.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{school.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 font-mono text-xs rounded-md text-slate-700 font-semibold">
                        {school.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-800">{school.email}</div>
                      <div className="text-[11px] text-slate-400">{school.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                          {sub.plan?.name} ({sub.plan?.billingCycle})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No Plan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          school.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {school._count?.students || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
