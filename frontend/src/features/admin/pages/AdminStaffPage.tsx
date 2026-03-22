import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api, getErrorMessage } from '@/lib/api'
import { useHasPermission } from '@/lib/permissions'
import {
  useCreateStaffAccount,
  useDepartments,
  useElevatedAccounts,
  useHireExistingUser,
  useRoles,
  useStaffCandidates,
  useStaffProfiles,
  useUpdateStaffAccountAccess,
  useUpdateStaffProfile,
  type StaffStatus,
} from '@/features/admin/services/staff'
import { useStaffPerformance } from '@/features/admin/services/staff-performance'
import { useStaffPayrolls, useGeneratePayroll, useUpdatePayroll } from '@/features/admin/services/staff-payroll'
import { BarChart3, Pencil, ListTodo, Plus, Mail, Phone, MapPin, Gift, Briefcase, User as UserIcon, ShieldAlert, Camera, Receipt, CreditCard, CalendarDays, Clock, History } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminSurfacePanel from '@/components/admin/AdminSurfacePanel'
import { useAuthStore } from '@/store/auth.store'
import Avatar from '@/features/profile/shared/components/Avatar'

const statusOptions: StaffStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE']

const AdminStaffPage = () => {
  // Staff directory filters, permissions, and create/edit workflow state.
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canCreateStaff = useHasPermission('hr.staff.create')
  const canEditStaff = useHasPermission('hr.staff.update')
  const canEditAccountAccess = currentUser?.role === 'SUPER_ADMIN'
  const canViewSalary = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.staffDepartmentName === 'Finance'
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<StaffStatus | ''>('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [search, setSearch] = useState('')
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState({
    staff: true,
    access: true,
    department: true,
    title: true,
    status: true,
    roles: true,
    actions: true,
  })

  const [existingHireForm, setExistingHireForm] = useState({
    userId: '',
    departmentId: '',
    employeeCode: '',
    title: '',
  })
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    employeeCode: '',
    title: '',
    sendActivationEmail: false,
    convertExisting: false,
  })

  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    employeeCode: '',
    departmentId: '',
    status: 'ACTIVE' as StaffStatus,
    accountRole: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
    dateJoined: '',
    birthDate: '',
    phoneNumber: '',
    personalEmail: '',
    homeAddress: '',
    emergencyContact: '',
    salary: '',
    avatarValue: '',
    avatarType: 'emoji' as 'emoji' | 'upload',
  })
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const { message, showMessage } = useTimedMessage(2400)

  const { data: departments = [] } = useDepartments()
  const { data: roles = [] } = useRoles()
  const { data: elevatedAccounts = [] } = useElevatedAccounts()
  const { data: staffProfiles = [], error: staffProfilesError } = useStaffProfiles({
    departmentId: departmentId || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  })

  const { data: performance } = useStaffPerformance(
    { staffId: selectedStaffId || undefined },
    { enabled: Boolean(selectedStaffId && isDetailsPanelOpen) }
  )

  const { data: payrolls = [] } = useStaffPayrolls(
    { staffId: selectedStaffId || undefined }
  )

  const generatePayroll = useGeneratePayroll()
  const updatePayroll = useUpdatePayroll()

  const [activeTab, setActiveTab] = useState<'profile' | 'payroll'>('profile')

  const { data: users = [] } = useStaffCandidates(candidateSearch, { enabled: canCreateStaff && createMode === 'existing' })

  const hireExistingUser = useHireExistingUser()
  const createStaffAccount = useCreateStaffAccount()
  const updateStaffProfile = useUpdateStaffProfile()
  const updateStaffAccountAccess = useUpdateStaffAccountAccess()

  // Derived directory rows and table visibility config for the staff grid.
  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return staffProfiles.filter((profile) => {
      if (departmentId && profile.departmentId !== departmentId) {
        return false
      }

      if (status && profile.status !== status) {
        return false
      }

      if (roleId && !profile.assignments.some((assignment) => assignment.roleId === roleId)) {
        return false
      }

      if (!query) {
        return true
      }

      return (
        profile.user.name.toLowerCase().includes(query) ||
        profile.user.email.toLowerCase().includes(query)
      )
    })
  }, [search, staffProfiles, departmentId, roleId, status])

  const selectedStaff = staffProfiles.find((profile) => profile.id === selectedStaffId)
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'staff', label: 'Staff' },
    { key: 'access', label: 'Account Access' },
    { key: 'department', label: 'Department' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'roles', label: 'Roles' },
    { key: 'actions', label: 'Actions' },
  ]
  const visibleColumnCount = columnOptions.filter((column) => visibleColumns[column.key]).length

  useEffect(() => {
    if (!selectedStaff) return
    setEditForm({
      title: selectedStaff.title || '',
      employeeCode: selectedStaff.employeeCode || '',
      departmentId: selectedStaff.departmentId || '',
      status: selectedStaff.status || 'ACTIVE',
      accountRole: selectedStaff.user.role,
      dateJoined: selectedStaff.dateJoined || '',
      birthDate: selectedStaff.birthDate || '',
      phoneNumber: selectedStaff.phoneNumber || '',
      personalEmail: selectedStaff.personalEmail || '',
      homeAddress: selectedStaff.homeAddress || '',
      emergencyContact: selectedStaff.emergencyContact || '',
      salary: selectedStaff.salary ? String(selectedStaff.salary) : '',
      avatarValue: selectedStaff.user.avatarValue || '',
      avatarType: (selectedStaff.user.avatarType as 'emoji' | 'upload') || 'emoji',
    })
  }, [selectedStaff])

  // Staff onboarding and profile-update handlers.
  const openEditModal = (staffId: string) => {
    setSelectedStaffId(staffId)
    setIsEditModalOpen(true)
    setIsDetailsPanelOpen(false)
  }

  const openDetailsPanel = (staffId: string) => {
    setSelectedStaffId(staffId)
    setIsDetailsPanelOpen(true)
  }

  const handleHireExistingUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!existingHireForm.userId || !existingHireForm.departmentId || !existingHireForm.title) {
      showMessage('User, department, and title are required.')
      return
    }

    try {
      await hireExistingUser.mutateAsync({
        userId: existingHireForm.userId,
        departmentId: existingHireForm.departmentId,
        employeeCode: existingHireForm.employeeCode || undefined,
        title: existingHireForm.title,
      })
      setExistingHireForm({ userId: '', departmentId: '', employeeCode: '', title: '' })
      setCandidateSearch('')
      setIsCreatePanelOpen(false)
      showMessage('Existing user hired successfully.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAccountForm.name || !newAccountForm.email || !newAccountForm.departmentId || !newAccountForm.title) {
      showMessage('Name, email, department, and title are required.')
      return
    }

    try {
      const result = await createStaffAccount.mutateAsync({
        name: newAccountForm.name,
        email: newAccountForm.email,
        departmentId: newAccountForm.departmentId,
        employeeCode: newAccountForm.employeeCode || undefined,
        title: newAccountForm.title,
        sendActivationEmail: newAccountForm.sendActivationEmail,
        convertExisting: newAccountForm.convertExisting,
      })
      setNewAccountForm({
        name: '',
        email: '',
        departmentId: '',
        employeeCode: '',
        title: '',
        sendActivationEmail: false,
        convertExisting: false,
      })
      setIsCreatePanelOpen(false)
      showMessage(
        result?.mode === 'CONVERTED_EXISTING_USER'
          ? 'Existing user converted to staff.'
          : 'New staff account created.',
      )
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as {
          message?: { code?: string; existingUser?: { id: string; email: string } } | string
        } | undefined
        const structured = typeof errorData?.message === 'object' ? errorData?.message : undefined
        if (structured?.code === 'EXISTING_USER_FOUND') {
          setNewAccountForm((prev) => ({ ...prev, convertExisting: true }))
          showMessage('User email already exists. Submit again to convert that existing user into staff.')
          return
        }
      }
      showMessage(getErrorMessage(error))
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEditForm((prev) => ({
        ...prev,
        avatarValue: data.url,
        avatarType: 'upload',
      }))
      showMessage('Avatar uploaded. Remember to save changes.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleUpdateSelectedStaff = async () => {
    if (!selectedStaffId) {
      showMessage('Select a staff row first.')
      return
    }

    if (!editForm.title || !editForm.departmentId || !editForm.employeeCode) {
      showMessage('Title, department, and employee code are required.')
      return
    }

    try {
      await updateStaffProfile.mutateAsync({
        id: selectedStaffId,
        data: {
          title: editForm.title,
          employeeCode: editForm.employeeCode,
          departmentId: editForm.departmentId,
          status: editForm.status,
          dateJoined: editForm.dateJoined || undefined,
          birthDate: editForm.birthDate || undefined,
          phoneNumber: editForm.phoneNumber || undefined,
          personalEmail: editForm.personalEmail || undefined,
          homeAddress: editForm.homeAddress || undefined,
          emergencyContact: editForm.emergencyContact || undefined,
          salary: editForm.salary ? Number(editForm.salary) : undefined,
          avatarValue: editForm.avatarValue || undefined,
          avatarType: editForm.avatarType || undefined,
        },
      })

      if (
        canEditAccountAccess &&
        selectedStaff?.user.role &&
        selectedStaff.user.role !== editForm.accountRole
      ) {
        await updateStaffAccountAccess.mutateAsync({
          id: selectedStaffId,
          role: editForm.accountRole,
        })
      }

      showMessage('Staff profile updated.')
      setIsEditModalOpen(false)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      {/* Main directory filters, staff table, and elevated-account summary. */}
      <AdminPageIntro
        eyebrow="Staff"
        title="Admin Staff Directory"
        actions={canCreateStaff ? (
          <button
            type="button"
            onClick={() => setIsCreatePanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        ) : null}
      />

      {message && (
        <AdminNotice>
          {message}
        </AdminNotice>
      )}
      {staffProfilesError && (
        <AdminNotice tone="error">
          {getErrorMessage(staffProfilesError)}
        </AdminNotice>
      )}

      <AdminSurfacePanel>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Filters</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  [{role.code || 'NO_CODE'}] {role.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StaffStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ColumnVisibilityMenu
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              options={columnOptions}
            />
          </div>

          <div className="admin-table-wrapper mt-4 overflow-auto">
            <table className="admin-table min-w-[1080px] text-sm">
              <thead className="admin-table-head">
              <tr>
                {visibleColumns.staff && <th className="px-3 py-2 text-left">Staff</th>}
                {visibleColumns.access && <th className="px-3 py-2 text-left">Account Access</th>}
                {visibleColumns.department && <th className="px-3 py-2 text-left">Department</th>}
                {visibleColumns.title && <th className="px-3 py-2 text-left">Title</th>}
                {visibleColumns.status && <th className="px-3 py-2 text-left">Status</th>}
                {visibleColumns.roles && <th className="px-3 py-2 text-left">Roles</th>}
                {visibleColumns.actions && <th className="px-3 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
                {filteredProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${selectedStaffId === profile.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                    onClick={() => openDetailsPanel(profile.id)}
                  >
                    {visibleColumns.staff && (
                      <td className="px-3 py-2">
                        <p className="font-semibold">{profile.user.name}</p>
                        <p className="text-xs text-slate-500">{profile.user.email}</p>
                      </td>
                    )}
                    {visibleColumns.access && (
                      <td className="px-3 py-2">
                        {(() => {
                          const accountAccessLabel =
                            profile.user.role === 'USER' ? 'STAFF' : profile.user.role

                          return (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            profile.user.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                              : profile.user.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-200'
                          }`}
                        >
                              {accountAccessLabel}
                        </span>
                          )
                        })()}
                      </td>
                    )}
                    {visibleColumns.department && <td className="px-3 py-2">{profile.department.name}</td>}
                    {visibleColumns.title && <td className="px-3 py-2">{profile.title}</td>}
                    {visibleColumns.status && <td className="px-3 py-2">{profile.status}</td>}
                    {visibleColumns.roles && (
                      <td className="px-3 py-2">
                        {profile.assignments.map((assignment) => `[${assignment.role.code || 'NO_CODE'}] ${assignment.role.name}`).join(', ') || 'None'}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!canEditStaff) {
                                showMessage('You do not have permission to edit staff profiles.')
                                return
                              }
                              openEditModal(profile.id)
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            title="Edit profile"
                            disabled={!canEditStaff}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/admin/staff/performance')
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            title="View performance"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/admin/staff/tasks')
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            title="View tasks"
                          >
                            <ListTodo className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-500" colSpan={visibleColumnCount}>No staff found for your filters.</td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
      </AdminSurfacePanel>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Admin & Super Admin Accounts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Platform-level access accounts shown here, with staff profile linkage.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {elevatedAccounts.length} accounts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[860px] text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Account Access</th>
                <th className="px-3 py-2 text-left">Staff Profile</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {elevatedAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-3 py-2 font-medium">{account.name}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{account.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        account.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                      }`}
                    >
                      {account.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {account.staffProfile
                      ? `${account.staffProfile.department.name} • ${account.staffProfile.title}`
                      : 'Not linked'}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {elevatedAccounts.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>
                    No admin or super admin accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over for hiring existing users or creating fresh staff accounts. */}
      <AdminSlideOverPanel
        open={Boolean(isCreatePanelOpen && canCreateStaff)}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="New Staff"
        title="Add Team Member"
        description="Create a new staff member or hire an existing user."
      >
        <div className="mt-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateMode('existing')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${createMode === 'existing' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/60'}`}
                  >
                    Hire Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('new')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${createMode === 'new' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/60'}`}
                  >
                    Create Account
                  </button>
                </div>
        </div>

        {createMode === 'existing' ? (
          <form onSubmit={handleHireExistingUser} className="mt-5 space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
                    <input
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search user by name/email"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <select
                      value={existingHireForm.userId}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, userId: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <select
                      value={existingHireForm.departmentId}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={existingHireForm.employeeCode}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                      placeholder="Employee code (optional)"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={existingHireForm.title}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
            </div>
            <button
              type="submit"
              disabled={hireExistingUser.isPending}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {hireExistingUser.isPending ? 'Hiring...' : 'Hire Existing User'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateStaffAccount} className="mt-5 space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
                    <input
                      value={newAccountForm.name}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={newAccountForm.email}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <select
                      value={newAccountForm.departmentId}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={newAccountForm.employeeCode}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                      placeholder="Employee code (optional)"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={newAccountForm.title}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newAccountForm.sendActivationEmail}
                        onChange={(e) => setNewAccountForm((prev) => ({ ...prev, sendActivationEmail: e.target.checked }))}
                      />
                      Send account activation email (placeholder)
                    </label>
                    {newAccountForm.convertExisting && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Existing email detected. Submitting now will convert that user into staff.
                      </p>
                    )}
            </div>
            <button
              type="submit"
              disabled={createStaffAccount.isPending}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createStaffAccount.isPending ? 'Creating...' : 'Create Staff Account'}
            </button>
          </form>
        )}
      </AdminSlideOverPanel>


      {/* Staff Detail Slider / Drawer */}
      <AdminSlideOverPanel
        open={Boolean(isDetailsPanelOpen && selectedStaff)}
        onClose={() => setIsDetailsPanelOpen(false)}
        kicker="Team Member"
        title="Staff Profile"
        description="Detailed overview of staff identity and performance."
        footer={(
          <div className="flex items-center justify-between gap-3 w-full">
             <button
              type="button"
              onClick={() => {
                 navigate('/admin/staff/tasks')
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ListTodo className="h-4 w-4" />
              Tasks
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDetailsPanelOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openEditModal(selectedStaffId)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
              >
                Edit Info
              </button>
            </div>
          </div>
        )}
      >
        {selectedStaff && (
          <div className="space-y-6 pb-20">
            {/* Header: Circular Avatar & Identity */}
            <div className="flex flex-col items-center justify-center space-y-4 pt-4">
              <div className="group relative">
                <Avatar
                  avatarType={(selectedStaff?.user.avatarType as 'emoji' | 'upload') || 'emoji'}
                  avatarValue={selectedStaff?.user.avatarValue || undefined}
                  size="xl"
                />
                <div className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white dark:border-slate-900 ${selectedStaff?.status === 'ACTIVE' ? 'bg-emerald-500' : selectedStaff?.status === 'ON_LEAVE' ? 'bg-amber-500' : 'bg-slate-400'}`} />
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedStaff?.user.name}
                </h3>
                <p className="flex items-center justify-center gap-1 text-sm text-slate-500">
                  <Mail className="h-3 w-3" />
                  {selectedStaff?.user.email}
                </p>
              </div>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition ${activeTab === 'profile' ? 'border-b-2 border-slate-900 text-slate-900 dark:border-amber-400 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Profile
              </button>
              {canViewSalary && (
                <button
                  onClick={() => setActiveTab('payroll')}
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition ${activeTab === 'payroll' ? 'border-b-2 border-slate-900 text-slate-900 dark:border-amber-400 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Payroll
                </button>
              )}
            </div>

            {activeTab === 'profile' ? (
              <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Tasks</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {performance?.summary?.totalTasks ?? (selectedStaff?._count?.tasks || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Performance</p>
                <p className="mt-1 text-2xl font-bold text-emerald-500">
                   {performance?.summary?.completionRate ?? 0}%
                </p>
              </div>
            </div>

            {/* Employment Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <Briefcase className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Employment Info</h4>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[10px] text-slate-500">Job Title</p>
                  <p className="text-sm font-medium">{selectedStaff?.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Employee Code</p>
                  <p className="font-mono text-sm font-medium">{selectedStaff?.employeeCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Department</p>
                  <p className="text-sm font-medium">{selectedStaff?.department.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Current Status</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedStaff?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                    {selectedStaff?.status}
                  </span>
                </div>
                <div>
                   <p className="text-[10px] text-slate-500">Date Joined</p>
                   <p className="text-sm font-medium">
                      {selectedStaff?.dateJoined && isValid(new Date(selectedStaff.dateJoined)) ? format(new Date(selectedStaff.dateJoined), 'PPP') : 'Not set'}
                   </p>
                </div>
                {canViewSalary && (
                  <div>
                    <p className="text-[10px] text-slate-500">Salary</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-amber-400">
                      {selectedStaff?.salary 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(selectedStaff.salary)) 
                        : 'Not set'}
                    </p>
                  </div>
                 )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <UserIcon className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Details</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-900/30">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Birthday</p>
                    <p className="text-sm font-medium">
                      {selectedStaff?.birthDate && isValid(new Date(selectedStaff.birthDate)) 
                        ? format(new Date(selectedStaff.birthDate), 'MMMM dd, yyyy') 
                        : 'Not documented'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-sky-50 p-2 text-sky-500 dark:bg-sky-900/30">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Phone Number</p>
                    <p className="text-sm font-medium">{selectedStaff?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-900/30">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Emergency Contact</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{selectedStaff?.emergencyContact || 'None listed'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Home Address</p>
                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {selectedStaff?.homeAddress || 'Address not registered in staff directory.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-6 text-white dark:bg-amber-400 dark:text-slate-900">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-80">Monthly Salary</h4>
                    <p className="mt-1 text-3xl font-black">
                      {selectedStaff?.salary 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(selectedStaff.salary) / 12) 
                        : '$0.00'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const now = new Date();
                      generatePayroll.mutate({
                        staffId: selectedStaff!.id,
                        month: now.getMonth() + 1,
                        year: now.getFullYear()
                      }, {
                        onSuccess: () => showMessage('Payroll generated for current month.')
                      });
                    }}
                    disabled={generatePayroll.isPending}
                    className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-white/30 disabled:opacity-50"
                  >
                    {generatePayroll.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    Generate {format(new Date(), 'MMMM')}
                  </button>
                </div>

                <div className="space-y-4">
                  <h5 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <History className="h-4 w-4" />
                    Payment History
                  </h5>
                  
                  {payrolls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
                       <CreditCard className="mb-3 h-8 w-8 text-slate-300" />
                       <p className="text-sm text-slate-500 font-medium">No payroll records found.</p>
                       <p className="text-xs text-slate-400">Records will appear after generation.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payrolls.map((payroll) => (
                        <div key={payroll.id} className="group relative rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {format(new Date(payroll.periodStart), 'MMMM yyyy')}
                              </span>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter ${
                              payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                              payroll.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {payroll.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-3 dark:border-slate-800/50">
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400">Base</p>
                               <p className="text-sm font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.amount)}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400">Bonus</p>
                               <p className="text-sm font-semibold text-emerald-600">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.bonus)}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400">Net Pay</p>
                               <p className="text-sm font-black text-slate-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.netAmount)}</p>
                             </div>
                          </div>

                          {payroll.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                updatePayroll.mutate({ id: payroll.id, status: 'PAID' }, {
                                  onSuccess: () => showMessage('Payroll marked as paid.')
                                });
                              }}
                              disabled={updatePayroll.isPending}
                              className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-amber-400 dark:hover:text-slate-900"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={Boolean(isEditModalOpen && selectedStaff)}
        onClose={() => setIsEditModalOpen(false)}
        kicker="Update Staff"
        title="Edit Profile"
        description="Modify staff identity, employment status, and personal info."
        footer={(
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateSelectedStaff}
              disabled={
                updateStaffProfile.isPending || updateStaffAccountAccess.isPending
              }
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {updateStaffProfile.isPending || updateStaffAccountAccess.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="relative">
              <Avatar
                avatarType="upload"
                avatarValue={editForm.avatarValue}
                size="xl"
              />
              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300">
                <Camera className="h-5 w-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAvatarUpload(file)
                  }}
                />
              </label>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff Photo</p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Work Info</h5>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <input
                value={editForm.employeeCode}
                onChange={(e) => setEditForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                placeholder="Employee code"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <select
                value={editForm.departmentId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as StaffStatus }))}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pt-2">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Joined</p>
                <input
                  type="date"
                  value={editForm.dateJoined ? new Date(editForm.dateJoined).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dateJoined: e.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Personal Info</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Birthday</p>
                  <input
                    type="date"
                    value={editForm.birthDate ? new Date(editForm.birthDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                  <input
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
              </div>
              <input
                value={editForm.personalEmail}
                onChange={(e) => setEditForm((prev) => ({ ...prev, personalEmail: e.target.value }))}
                placeholder="Personal email"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
               />
               {canViewSalary && (
                 <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly/Annual Salary</p>
                    <input
                      type="number"
                      value={editForm.salary}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, salary: e.target.value }))}
                      placeholder="e.g. 50000"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                 </div>
               )}
               <input
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Emergency contact (Name & Phone)"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <textarea
                value={editForm.homeAddress}
                onChange={(e) => setEditForm((prev) => ({ ...prev, homeAddress: e.target.value }))}
                placeholder="Home address"
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Access Control</h5>
              {canEditAccountAccess && (
                <select
                  value={editForm.accountRole}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      accountRole: e.target.value as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="USER">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              )}
          </div>
        </div>
      </AdminSlideOverPanel>
    </div>
  )
}

export default AdminStaffPage
