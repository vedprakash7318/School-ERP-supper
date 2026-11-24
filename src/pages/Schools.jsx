import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Ban,
  Trash2,
  Edit,
  CreditCard,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Check,
  Image,
} from 'lucide-react';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [isAssignSubModalOpen, setIsAssignSubModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [copiedLink, setCopiedLink] = useState('');

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    code: '',
    admissionPrefix: 'DPS',
    email: '',
    phone: '',
    logo: '',
    address: '',
    city: '',
    state: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    planId: '',
  });

  const [editAdminForm, setEditAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'ACTIVE',
  });

  const [assignSubForm, setAssignSubForm] = useState({
    planId: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools(pagination.page, pagination.limit, search, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, pagination.page, pagination.limit]);

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

  const fetchSchools = async (page = 1, limit = 10, searchQuery = '', status = '') => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/schools', {
        params: { page, limit, search: searchQuery, status },
      });
      if (res.data.success) {
        setSchools(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Auto-generate slug and prefix when name changes
  const handleNameChange = (val) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const prefix = val
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);

    setAddForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug ? prev.slug : slug,
      code: prev.code,
      admissionPrefix: prev.admissionPrefix ? prev.admissionPrefix : prefix || 'SCH',
    }));
  };

  // Upload logo to local backend folder /uploads/logos
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload?type=logos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setAddForm((prev) => ({ ...prev, logo: res.data.data.url }));
        }
      } catch (err) {
        // Fallback to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setAddForm((prev) => ({ ...prev, logo: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCopyLink = (url, label) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleToggleStatus = async (school) => {
    const newStatus = school.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? `Are you sure you want to SUSPEND "${school.name}"? School admin and users will not be able to log in.`
        : `Unblock "${school.name}" and restore access?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.patch(`/super-admin/schools/${school.id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchSchools(pagination.page, pagination.limit, search, statusFilter);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteSchool = async (school) => {
    if (
      !window.confirm(
        `DANGER: Are you sure you want to permanently delete "${school.name}"? This removes all students, staff, classes, and subscriptions for this school!`
      )
    )
      return;

    try {
      const res = await api.delete(`/super-admin/schools/${school.id}`);
      if (res.data.success) {
        fetchSchools(pagination.page, pagination.limit, search, statusFilter);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete school');
    }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.post('/super-admin/schools', addForm);
      if (res.data.success) {
        setFormSuccess(res.data.message || 'School and Principal created successfully!');
        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormSuccess('');
          setAddForm({
            name: '',
            slug: '',
            code: '',
            admissionPrefix: 'DPS',
            email: '',
            phone: '',
            logo: '',
            address: '',
            city: '',
            state: '',
            adminName: '',
            adminEmail: '',
            adminPassword: '',
            planId: '',
          });
          fetchSchools(1, pagination.limit, search, statusFilter);
        }, 1200);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create school');
    }
  };

  const handleOpenEditAdmin = (school) => {
    setSelectedSchool(school);
    const admin = school.users?.[0];
    setEditAdminForm({
      name: admin?.name || '',
      email: admin?.email || '',
      phone: admin?.phone || '',
      password: '',
      status: admin?.status || 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setIsEditAdminModalOpen(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.put(`/super-admin/schools/${selectedSchool.id}/admin`, editAdminForm);
      if (res.data.success) {
        setFormSuccess('Admin credentials updated successfully!');
        setTimeout(() => {
          setIsEditAdminModalOpen(false);
          setFormSuccess('');
          fetchSchools(pagination.page, pagination.limit, search, statusFilter);
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update admin details');
    }
  };

  const handleOpenAssignSub = (school) => {
    setSelectedSchool(school);
    setAssignSubForm({
      planId: plans[0]?.id || '',
      notes: '',
    });
    setFormError('');
    setFormSuccess('');
    setIsAssignSubModalOpen(true);
  };

  const handleAssignSub = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.post('/super-admin/subscriptions/assign', {
        schoolId: selectedSchool.id,
        planId: assignSubForm.planId,
        notes: assignSubForm.notes,
      });
      if (res.data.success) {
        setFormSuccess('Subscription assigned/renewed successfully!');
        setTimeout(() => {
          setIsAssignSubModalOpen(false);
          setFormSuccess('');
          fetchSchools(pagination.page, pagination.limit, search, statusFilter);
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to assign subscription');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tenant Schools & Institutions
          </h2>
          <p className="text-sm text-slate-500">
            Multi-tenant management: slugs, custom branding, admission prefixes, and public links.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 text-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New School</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search school name, slug, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">School & Slug</th>
                <th className="px-6 py-4">Owner & Principal</th>
                <th className="px-6 py-4">Public Portals (Links)</th>
                <th className="px-6 py-4">Counts</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-400 mt-2">Loading schools from server...</p>
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No schools match your search query.
                  </td>
                </tr>
              ) : (
                schools.map((school) => {
                  const owner = school.users?.find((u) => u.role === 'SCHOOL_ADMIN') || school.users?.[0];
                  const principal = school.users?.find((u) => u.role === 'PRINCIPAL');
                  const sub = school.subscriptions?.[0];
                  const isSuspended = school.status === 'SUSPENDED' || school.status === 'BLOCKED';
                  const schoolAppBase = window.location.origin.replace('5173', '5174');

                  const loginUrl = `${schoolAppBase}/${school.slug}/login`;
                  const admissionUrl = `${schoolAppBase}/${school.slug}/admission`;
                  const staffJoinUrl = `${schoolAppBase}/${school.slug}/join-staff`;

                  return (
                    <tr
                      key={school.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-rose-50/25' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {school.logo ? (
                            <img
                              src={school.logo}
                              alt="logo"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center">
                              {school.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              {school.name}
                              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                                {school.code}
                              </span>
                            </div>
                            <div className="text-xs text-brand-600 font-mono mt-0.5 font-semibold">
                              /:slug/{school.slug}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Prefix: <span className="font-mono font-bold text-slate-700">{school.admissionPrefix || 'DPS'}</span> • {school.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {owner ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                OWNER
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{owner.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{owner.email}</div>
                            <div className="text-[10px] text-slate-400">Pass: Initial phone ({owner.phone || school.phone})</div>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-medium">No owner linked</span>
                        )}

                        <div className="mt-2 pt-1.5 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              PRINCIPAL
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {principal ? principal.name : 'Not yet appointed'}
                            </span>
                          </div>
                          {principal && (
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{principal.email}</div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {/* Admission Link */}
                          <button
                            onClick={() => handleCopyLink(admissionUrl, `${school.id}-adm`)}
                            className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-2 py-1 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            {copiedLink === `${school.id}-adm` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>{copiedLink === `${school.id}-adm` ? 'Copied Admission!' : 'Copy Online Admission'}</span>
                          </button>

                          {/* Staff Join Link */}
                          <button
                            onClick={() => handleCopyLink(staffJoinUrl, `${school.id}-staff`)}
                            className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 px-2 py-1 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            {copiedLink === `${school.id}-staff` ? (
                              <Check className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{copiedLink === `${school.id}-staff` ? 'Copied Staff URL!' : 'Copy Staff Join Link'}</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs space-y-0.5">
                        <div className="text-slate-800">
                          <span className="font-bold">{school._count?.students || 0}</span> Students
                        </div>
                        <div className="text-slate-500">
                          <span className="font-semibold">{school._count?.staffMembers || 0}</span> Teachers
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isSuspended ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {school.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign/Renew Subscription */}
                          <button
                            title="Renew or Assign Subscription"
                            onClick={() => handleOpenAssignSub(school)}
                            className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Edit School Admin */}
                          <button
                            title="Edit School Admin Credentials"
                            onClick={() => handleOpenEditAdmin(school)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Toggle Suspend / Unsuspend */}
                          <button
                            title={isSuspended ? 'Activate School' : 'Suspend School'}
                            onClick={() => handleToggleStatus(school)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {/* Delete School */}
                          <button
                            title="Delete School"
                            onClick={() => handleDeleteSchool(school)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Modal: Add New School */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Tenant School"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSchool} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Name *</label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Woodland Academy"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unique URL Slug * (/:slug/login)
              </label>
              <input
                type="text"
                required
                value={addForm.slug}
                onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().trim() })}
                placeholder="e.g. woodland-academy"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-brand-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">School Code</label>
                <span className="text-[10px] text-slate-400 font-semibold">(Optional)</span>
              </div>
              <input
                type="text"
                value={addForm.code}
                onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                placeholder="Optional (Auto-generated if blank)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admission Prefix (e.g. WOOD, DPS, STU)
              </label>
              <input
                type="text"
                required
                value={addForm.admissionPrefix}
                onChange={(e) => setAddForm({ ...addForm, admissionPrefix: e.target.value.toUpperCase() })}
                placeholder="WOOD"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Official Email *</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="info@woodland.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone Number *</label>
              <input
                type="text"
                required
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">School Logo (Upload)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 mb-2">
              School Owner Account (Primary Admin)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Initial password will automatically be set to the school's phone number (<span className="font-mono font-bold">{addForm.phone || 'Phone Number'}</span>). The Owner can later add/manage the Principal from the app.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School Owner / Director Name</label>
                <input
                  type="text"
                  value={addForm.adminName}
                  onChange={(e) => setAddForm({ ...addForm, adminName: e.target.value })}
                  placeholder="Owner / Chairman Full Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={addForm.planId}
                  onChange={(e) => setAddForm({ ...addForm, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  <option value="">No initial plan (inactive)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price} ({p.billingCycle})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30"
            >
              Register School & Owner
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit School Admin */}
      <Modal
        isOpen={isEditAdminModalOpen}
        onClose={() => setIsEditAdminModalOpen(false)}
        title={`Edit School Owner / Admin: ${selectedSchool?.name || ''}`}
      >
        <form onSubmit={handleUpdateAdmin} className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Principal Full Name</label>
            <input
              type="text"
              required
              value={editAdminForm.name}
              onChange={(e) => setEditAdminForm({ ...editAdminForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Login Email</label>
            <input
              type="email"
              required
              value={editAdminForm.email}
              onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={editAdminForm.phone}
              onChange={(e) => setEditAdminForm({ ...editAdminForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reset Password (leave empty to keep current)
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={editAdminForm.password}
              onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditAdminModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Subscription */}
      <Modal
        isOpen={isAssignSubModalOpen}
        onClose={() => setIsAssignSubModalOpen(false)}
        title={`Renew / Assign Subscription: ${selectedSchool?.name || ''}`}
      >
        <form onSubmit={handleAssignSub} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Subscription Plan *</label>
            <select
              required
              value={assignSubForm.planId}
              onChange={(e) => setAssignSubForm({ ...assignSubForm, planId: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price} ({p.billingCycle} - {p.durationDays} Days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Reference / Notes</label>
            <textarea
              rows={2}
              value={assignSubForm.notes}
              onChange={(e) => setAssignSubForm({ ...assignSubForm, notes: e.target.value })}
              placeholder="e.g. Offline bank transfer Ref #98124 or Cash payment"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignSubModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30"
            >
              Activate Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schools;
