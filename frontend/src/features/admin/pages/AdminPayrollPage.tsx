import { useState } from 'react'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { 
  useStaffPayrolls, 
  useUpdatePayroll, 
} from '@/features/admin/services/staff-payroll'
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  History
} from 'lucide-react'
import { format } from 'date-fns'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const AdminPayrollPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const { message, showMessage } = useTimedMessage()
  
  const { data: payrolls = [], isLoading } = useStaffPayrolls({ 
    status: statusFilter || undefined 
  })
  
  const updatePayroll = useUpdatePayroll()

  const filteredPayrolls = payrolls.filter(p => 
    p.staffProfile?.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.staffProfile?.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingAmount = payrolls
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.netAmount, 0)
    
  const totalPaidThisMonth = payrolls
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.netAmount, 0)

  const handleMarkAsPaid = (id: string) => {
    updatePayroll.mutate({ id, status: 'PAID' }, {
      onSuccess: () => showMessage('Payroll marked as paid successfully.')
    })
  }

  return (
    <div className="space-y-6 p-8">
      <AdminPageIntro 
        title="Staff Payroll Management" 
      />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="luxe-panel p-6 border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending Payouts</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pendingAmount)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-500 dark:bg-amber-900/20">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {payrolls.filter(p => p.status === 'PENDING').length} records awaiting processing
          </p>
        </div>

        <div className="luxe-panel p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Paid (Month)</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPaidThisMonth)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-500 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Successfully processed for {format(new Date(), 'MMMM')}
          </p>
        </div>

        <div className="luxe-panel p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Average Net Pay</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  payrolls.length > 0 ? payrolls.reduce((sum, p) => sum + p.netAmount, 0) / payrolls.length : 0
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-500 dark:bg-indigo-900/20">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Based on {payrolls.length} historical records</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="luxe-panel overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Clock className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <History className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No payroll records found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Staff Member</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Period</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Base Salary</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Bonus / Ded.</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Net Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 dark:bg-slate-800">
                          {payroll.staffProfile?.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{payroll.staffProfile?.user.name}</p>
                          <p className="text-[11px] text-slate-500">{payroll.staffProfile?.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium">
                          {format(new Date(payroll.periodStart), 'MMM yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-emerald-600">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.bonus)}</p>
                        <p className="text-[11px] font-bold text-rose-500">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.deductions)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-black text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payroll.netAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter ${
                        payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                        payroll.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payroll.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleMarkAsPaid(payroll.id)}
                          disabled={updatePayroll.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                        >
                          Process Payment
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {payroll.paymentDate ? `Paid ${format(new Date(payroll.paymentDate), 'MMM dd')}` : 'Settled'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Message Toast */}
      {message && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-2xl dark:bg-amber-400 dark:text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 dark:text-slate-900" />
            <p className="text-sm font-bold tracking-tight">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPayrollPage
