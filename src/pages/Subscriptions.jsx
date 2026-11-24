import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import {
  CreditCard,
  Plus,
  Calendar,
  Check,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  ShieldAlert,
  Users,
} from 'lucide-react';

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [planForm, setPlanForm] = useState({
    name: '',
    billingCycle: 'MONTHLY',
    price: '',
    durationDays: '30',
    description: '',
    maxStudents: '1000',
    maxStaff: '100',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const billingCycleDurations = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
  };

  useEffect(() => {
    fetchPlans();
    fetchHistory(pagination.page, pagination.limit);
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/subscriptions/history', {
        params: { page, limit },
      });
      if (res.data.success) {
        setHistory(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      billingCycle: 'MONTHLY',
      price: '',
      durationDays: '30',
      description: '',
      maxStudents: '1000',
      maxStaff: '100',
    });
    setFormError('');
    setFormSuccess('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      billingCycle: plan.billingCycle,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      description: plan.description || '',
      maxStudents: plan.maxStudents.toString(),
      maxStaff: plan.maxStaff.toString(),
    });
    setFormError('');
    setFormSuccess('');
    setIsPlanModalOpen(true);
  };

  const handleCycleChange = (cycle) => {
    setPlanForm((prev) => ({
      ...prev,
      billingCycle: cycle,
      durationDays: billingCycleDurations[cycle] ? billingCycleDurations[cycle].toString() : prev.durationDays,
    }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      if (editingPlan) {
        const res = await api.put(`/super-admin/plans/${editingPlan.id}`, planForm);
        if (res.data.success) {
          setFormSuccess('Plan updated successfully!');
        }
      } else {
        const res = await api.post('/super-admin/plans', planForm);
        if (res.data.success) {
          setFormSuccess('New plan created successfully!');
        }
      }

      setTimeout(() => {
        setIsPlanModalOpen(false);
        setFormSuccess('');
        fetchPlans();
      }, 800);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;

    try {
      const res = await api.delete(`/super-admin/plans/${plan.id}`);
      if (res.data.success) {
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Subscription Tier Management
          </h2>
          <p className="text-sm text-slate-500">
            Define pricing models: Daily, Weekly, Monthly, Quarterly, and Yearly licenses.
          </p>
        </div>
        <button
          onClick={handleOpenCreatePlan}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 text-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {plans.map((plan) => {
          const cycleBadge = {
            DAILY: 'bg-orange-50 text-orange-700 border-orange-200',
            WEEKLY: 'bg-blue-50 text-blue-700 border-blue-200',
            MONTHLY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            QUARTERLY: 'bg-purple-50 text-purple-700 border-purple-200',
            YEARLY: 'bg-amber-50 text-amber-700 border-amber-200',
          }[plan.billingCycle] || 'bg-slate-50 text-slate-700 border-slate-200';

          return (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${cycleBadge}`}
                  >
                    {plan.billingCycle}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="p-1 text-slate-400 hover:text-brand-600 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {plan.durationDays}d</span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                  {plan.description || 'Standard institutional license'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Max {plan.maxStudents} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Max {plan.maxStaff} Staff Members</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>Active Subscriptions:</span>
                <span className="text-slate-800 font-bold">{plan._count?.subscriptions || 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Assignment & Renewal History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Subscription History & Audit Log</h3>
          <p className="text-xs text-slate-500">Record of all subscriptions assigned, renewed, and billed</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Cycle</th>
                <th className="px-6 py-4">Validity Range</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No subscription logs found.
                  </td>
                </tr>
              ) : (
                history.map((sub) => {
                  const isExpired = new Date(sub.endDate) < new Date();
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{sub.school?.name}</span>
                        <span className="ml-2 font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          {sub.school?.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{sub.plan?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono text-xs rounded text-slate-700 font-bold">
                          {sub.plan?.billingCycle}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {new Date(sub.startDate).toLocaleDateString()} &rarr;{' '}
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{sub.amountPaid}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            isExpired
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : sub.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(page) => {
            setPagination((prev) => ({ ...prev, page }));
            fetchHistory(page, pagination.limit);
          }}
          onLimitChange={(limit) => {
            setPagination((prev) => ({ ...prev, limit, page: 1 }));
            fetchHistory(1, limit);
          }}
        />
      </div>

      {/* Modal: Create or Edit Plan */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
              {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Plan Title *</label>
            <input
              type="text"
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Monthly Standard"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Cycle *</label>
              <select
                value={planForm.billingCycle}
                onChange={(e) => handleCycleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              >
                <option value="DAILY">DAILY (1 Day)</option>
                <option value="WEEKLY">WEEKLY (7 Days)</option>
                <option value="MONTHLY">MONTHLY (30 Days)</option>
                <option value="QUARTERLY">QUARTERLY (90 Days)</option>
                <option value="YEARLY">YEARLY (365 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={planForm.durationDays}
                onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              placeholder="e.g. 1499"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Students</label>
              <input
                type="number"
                value={planForm.maxStudents}
                onChange={(e) => setPlanForm({ ...planForm, maxStudents: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Staff</label>
              <input
                type="number"
                value={planForm.maxStaff}
                onChange={(e) => setPlanForm({ ...planForm, maxStaff: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Plan Description</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Brief description of included features"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30"
            >
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
