import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronDown, MessageSquare, StickyNote } from 'lucide-react'
import {
  useAddInquiryMessage,
  useAddInternalNote,
  useAssignInquiry,
  useEscalateInquiry,
  useInquiryAudit,
  useInquiry,
  useInquiryQuickReplyTemplates,
  useUpdateInquiryStatus,
} from '@/services/inquiries'
import { useDepartments, useStaffProfiles } from '@/features/admin/services/staff'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'

const STATUS_FLOW: Record<string, string[]> = {
  OPEN: ['ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'],
  ASSIGNED: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED'],
  IN_PROGRESS: ['ESCALATED', 'RESOLVED'],
  ESCALATED: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

const actionLabelMap: Record<string, string> = {
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  ESCALATED: 'Escalated',
  STATUS_CHANGED: 'Status updated',
  CLOSED: 'Closed',
}

type QuickReplyTemplate = {
  id: string
  title: string
  body: string
  tags?: string[]
}

const DEFAULT_QUICK_REPLIES: Record<string, QuickReplyTemplate[]> = {
  common: [
    {
      id: 'common-ack',
      title: 'Acknowledge + investigating',
      body: 'Thanks for reaching out. We have received your message and are actively checking this for you. We will update you again shortly with the next step.',
      tags: ['general'],
    },
    {
      id: 'common-resolved',
      title: 'Issue resolved confirmation',
      body: 'We have completed the requested update on our side. Please check again and let us know if anything still looks off so we can continue immediately.',
      tags: ['resolution'],
    },
    {
      id: 'common-followup',
      title: 'Need more details',
      body: 'To help you faster, could you share the order number, the exact issue, and a screenshot if possible? Once we have that, we can proceed right away.',
      tags: ['triage'],
    },
  ],
  support: [
    {
      id: 'support-delay',
      title: 'Delivery delay update',
      body: 'We checked your order and it is currently delayed in transit. We are following up with logistics now and will send your next update within 24 hours.',
      tags: ['delivery'],
    },
    {
      id: 'support-refund',
      title: 'Refund process update',
      body: 'Your refund request is now in progress. Once finance confirms completion, we will notify you immediately with the transaction reference.',
      tags: ['refund'],
    },
  ],
  author: [
    {
      id: 'author-routing',
      title: 'Author inquiry handoff',
      body: 'Thank you for contacting us. Your request has been forwarded to our author partnerships team, and they will follow up with you shortly.',
      tags: ['author'],
    },
  ],
  publisher: [
    {
      id: 'publisher-routing',
      title: 'Publisher inquiry handoff',
      body: 'Thanks for the details. We have routed this to our publisher support desk for review, and we will send a follow-up after their confirmation.',
      tags: ['publisher'],
    },
  ],
}

const normalizeInquiryType = (value?: string) => {
  const key = value?.toLowerCase().trim()
  if (!key) return 'common'
  if (key.includes('support')) return 'support'
  if (key.includes('author')) return 'author'
  if (key.includes('publisher')) return 'publisher'
  return 'common'
}

const inferRoutingHint = (subject?: string, type?: string, departmentCode?: string) => {
  const text = `${subject ?? ''} ${type ?? ''}`.toLowerCase()
  if (/(ad|ads|advert|campaign|sponsor|promotion|boost)/.test(text)) {
    return {
      teamCode: 'MKT',
      title: 'Recommend Marketing',
      detail: 'This case looks like ads/campaign activity and should be handled by Marketing.',
    }
  }
  if (/(rights|copyright|dmca|legal|contract|license)/.test(text)) {
    return {
      teamCode: 'LEGAL',
      title: 'Recommend Legal',
      detail: 'This case appears to involve rights/compliance and should be reviewed by Legal.',
    }
  }
  if (/(stock|inventory|restock|availability|warehouse)/.test(text)) {
    return {
      teamCode: 'STOCK',
      title: 'Recommend Stock Management',
      detail: 'This case appears inventory-related and should be routed to Stock Management.',
    }
  }
  if (/(refund|charge|payment|invoice|billing)/.test(text)) {
    return {
      teamCode: 'FIN',
      title: 'Recommend Finance',
      detail: 'This case looks finance-related and should be routed to Finance.',
    }
  }
  return {
    teamCode: departmentCode ?? 'CS',
    title: 'Keep in current queue',
    detail: 'No strong cross-department signal detected yet.',
  }
}

type ParsedStructuredMessage = {
  senderName: string
  senderEmail: string
  topic: string
  fields: Array<{ label: string; value: string }>
  body: string
}

const parseStructuredContactMessage = (raw: string): ParsedStructuredMessage | null => {
  if (!raw?.trim()) return null

  const lines = raw.split(/\r?\n/)
  const firstLine = lines[0]?.trim() ?? ''
  if (!/^contact sender:/i.test(firstLine)) return null

  const senderMatch = firstLine.match(/^contact sender:\s*(.+?)\s*<([^>]+)>\s*$/i)
  const senderName = senderMatch?.[1]?.trim() ?? ''
  const senderEmail = senderMatch?.[2]?.trim() ?? ''
  if (!senderName || !senderEmail) return null

  let topic = ''
  const fields: Array<{ label: string; value: string }> = []
  const bodyLines: string[] = []
  let inStockSection = false
  let inBodySection = false

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const trimmed = line.trim()

    if (!inBodySection && trimmed.length === 0) {
      if (inStockSection) {
        inBodySection = true
      }
      continue
    }

    if (!inBodySection && /^topic:/i.test(trimmed)) {
      topic = trimmed.replace(/^topic:\s*/i, '').trim()
      continue
    }

    if (!inBodySection && /^stock request details:/i.test(trimmed)) {
      inStockSection = true
      continue
    }

    if (!inBodySection && inStockSection) {
      const separator = trimmed.indexOf(':')
      if (separator > 0) {
        const label = trimmed.slice(0, separator).trim()
        const value = trimmed.slice(separator + 1).trim()
        if (label && value) {
          fields.push({ label, value })
          continue
        }
      }
      inBodySection = true
    }

    bodyLines.push(line)
  }

  return {
    senderName,
    senderEmail,
    topic,
    fields,
    body: bodyLines.join('\n').trim(),
  }
}

const CSInquiryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useInquiry(id, true)
  const { data: audit = [] } = useInquiryAudit(id, true)
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [assigneeStaffId, setAssigneeStaffId] = useState('')
  const [toDepartmentId, setToDepartmentId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [customTemplateTitle, setCustomTemplateTitle] = useState('')
  const [customTemplates, setCustomTemplates] = useState<QuickReplyTemplate[]>([])
  const [openSidebarPanel, setOpenSidebarPanel] = useState<string | null>(null)

  const user = useAuthStore((state) => state.user)
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const canReply = isPrivileged || hasPermission(user?.permissions, 'support.inquiries.reply') || hasPermission(user?.permissions, 'finance.inquiries.reply') || hasPermission(user?.permissions, 'department.inquiries.reply')
  const canMarketingReply = hasPermission(user?.permissions, 'marketing.inquiries.reply') || hasPermission(user?.permissions, 'marketing.inquiries.manage')
  const canAssign = isPrivileged || hasPermission(user?.permissions, 'support.inquiries.assign') || hasPermission(user?.permissions, 'finance.inquiries.manage') || hasPermission(user?.permissions, 'marketing.inquiries.manage')
  const canEscalate = isPrivileged || hasPermission(user?.permissions, 'support.inquiries.escalate') || hasPermission(user?.permissions, 'finance.inquiries.manage') || hasPermission(user?.permissions, 'marketing.inquiries.manage')
  const canReplyResolved = canReply || canMarketingReply
  const canUpdateStatus = canReplyResolved || canAssign || canEscalate

  const addMessage = useAddInquiryMessage()
  const addNote = useAddInternalNote()
  const updateStatus = useUpdateInquiryStatus()
  const assignInquiry = useAssignInquiry()
  const escalateInquiry = useEscalateInquiry()
  const { data: departments = [] } = useDepartments({ enabled: canEscalate })
  const { data: assignableStaff = [] } = useStaffProfiles(
    { departmentId: data?.department?.id, status: 'ACTIVE' },
    { enabled: canAssign && Boolean(data?.department?.id) },
  )
  const { data: sharedTemplates = [] } = useInquiryQuickReplyTemplates(data?.type, canReplyResolved)

  const messages = data?.messages ?? []
  const notes = data?.internalNotes ?? []
  const activeStatus = status || data?.status || 'OPEN'

  const canSubmitMessage = canReplyResolved && message.trim().length > 0 && !addMessage.isPending
  const canSubmitNote = canUpdateStatus && note.trim().length > 0 && !addNote.isPending

  const statusLabel = useMemo(() => data?.status?.toUpperCase() ?? 'OPEN', [data?.status])
  const statusOptions = useMemo(() => {
    const current = data?.status?.toUpperCase() ?? 'OPEN'
    return [current, ...(STATUS_FLOW[current] ?? [])]
  }, [data?.status])
  const canTakeOwnership = useMemo(() => {
    if (!data) return false
    const current = data.status?.toUpperCase()
    return canUpdateStatus && !data.assignedToStaff?.id && current !== 'RESOLVED' && current !== 'CLOSED'
  }, [canUpdateStatus, data])
  const availableDepartments = useMemo(
    () => departments.filter((item) => item.isActive && item.id !== data?.department?.id),
    [departments, data?.department?.id],
  )
  const routingHint = useMemo(
    () => inferRoutingHint(data?.subject, data?.type, data?.department?.code),
    [data?.department?.code, data?.subject, data?.type],
  )
  const reassignableStaff = useMemo(
    () => assignableStaff.filter((staff) => staff.id !== data?.assignedToStaff?.id),
    [assignableStaff, data?.assignedToStaff?.id],
  )
  const quickReplyStorageKey = useMemo(
    () => `cs.quick-replies.${user?.id ?? 'anonymous'}`,
    [user?.id],
  )
  const quickReplyTypeKey = useMemo(
    () => normalizeInquiryType(data?.type),
    [data?.type],
  )
  const quickReplyTemplates = useMemo(() => {
    const builtInFallback = [
      ...DEFAULT_QUICK_REPLIES.common,
      ...(DEFAULT_QUICK_REPLIES[quickReplyTypeKey] ?? []),
    ]
    const shared = sharedTemplates.map((item) => ({
      id: `shared-${item.id}`,
      title: item.title,
      body: item.body,
      tags: item.tags,
    }))
    const sourceTemplates = shared.length > 0 ? shared : builtInFallback
    const unique = new Map<string, QuickReplyTemplate>()
    sourceTemplates.forEach((item) => unique.set(item.id, item))
    customTemplates.forEach((item) => unique.set(item.id, item))
    return Array.from(unique.values())
  }, [customTemplates, quickReplyTypeKey, sharedTemplates])
  const selectedTemplate = useMemo(
    () => quickReplyTemplates.find((item) => item.id === selectedTemplateId) ?? null,
    [quickReplyTemplates, selectedTemplateId],
  )
  const selectedTemplateIsCustom = Boolean(selectedTemplate?.id.startsWith('custom-'))

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(quickReplyStorageKey)
      if (!raw) {
        setCustomTemplates([])
        return
      }
      const parsed = JSON.parse(raw) as QuickReplyTemplate[]
      if (!Array.isArray(parsed)) {
        setCustomTemplates([])
        return
      }
      setCustomTemplates(
        parsed.filter((item) => typeof item?.id === 'string' && typeof item?.title === 'string' && typeof item?.body === 'string'),
      )
    } catch {
      setCustomTemplates([])
    }
  }, [quickReplyStorageKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(quickReplyStorageKey, JSON.stringify(customTemplates))
    } catch {
      // Best effort persistence.
    }
  }, [customTemplates, quickReplyStorageKey])
  const inChargeLabel = useMemo(() => {
    if (statusLabel === 'RESOLVED' || statusLabel === 'CLOSED') {
      return data?.assignedToStaff?.user?.name
        ? `Solved by ${data.assignedToStaff.user.name}`
        : 'Solved'
    }

    if (data?.assignedToStaff?.user?.name) {
      return `In charge: ${data.assignedToStaff.user.name}`
    }

    if (statusLabel === 'OPEN') {
      return 'Unchecked'
    }

    return undefined
  }, [data?.assignedToStaff?.user?.name, statusLabel])
  const isClosedFlow = statusLabel === 'RESOLVED' || statusLabel === 'CLOSED'
  const showReassignSection = canAssign && !isClosedFlow
  const showEscalationSection = canEscalate && !isClosedFlow

  const handleSendMessage = async () => {
    if (!id || !canSubmitMessage) return
    await addMessage.mutateAsync({ inquiryId: id, message: message.trim() })
    setMessage('')
  }

  const handleAddNote = async () => {
    if (!id || !canSubmitNote) return
    await addNote.mutateAsync({ inquiryId: id, note: note.trim() })
    setNote('')
  }

  const handleStatusChange = async () => {
    if (!id || !canUpdateStatus || !status || status === data?.status) return
    await updateStatus.mutateAsync({ inquiryId: id, status })
  }

  const handleTakeOwnership = async () => {
    if (!id || !canTakeOwnership) return
    await updateStatus.mutateAsync({ inquiryId: id, status: 'IN_PROGRESS' })
  }

  const handleAssign = async () => {
    if (!id || !assigneeStaffId || !canAssign) return
    await assignInquiry.mutateAsync({ inquiryId: id, staffProfileId: assigneeStaffId })
    setAssigneeStaffId('')
  }

  const handleEscalate = async () => {
    if (!id || !toDepartmentId || !canEscalate) return
    await escalateInquiry.mutateAsync({ inquiryId: id, toDepartmentId })
    setToDepartmentId('')
  }
  const suggestedDepartment = useMemo(
    () => availableDepartments.find((dept) => dept.code.toUpperCase() === routingHint.teamCode.toUpperCase()) ?? null,
    [availableDepartments, routingHint.teamCode],
  )
  const applySuggestedRoute = () => {
    if (!suggestedDepartment) return
    setToDepartmentId(suggestedDepartment.id)
  }

  const handleApplyTemplate = (mode: 'replace' | 'append') => {
    if (!selectedTemplate) return

    if (mode === 'replace' || message.trim().length === 0) {
      setMessage(selectedTemplate.body)
      return
    }

    setMessage((prev) => `${prev.trimEnd()}\n\n${selectedTemplate.body}`)
  }

  const handleSaveAsTemplate = () => {
    const title = customTemplateTitle.trim()
    const body = message.trim()
    if (!title || !body) return

    const nextTemplate: QuickReplyTemplate = {
      id: `custom-${Date.now()}`,
      title,
      body,
      tags: ['custom'],
    }

    setCustomTemplates((prev) => [nextTemplate, ...prev].slice(0, 30))
    setSelectedTemplateId(nextTemplate.id)
    setCustomTemplateTitle('')
  }

  const handleDeleteCustomTemplate = () => {
    if (!selectedTemplateIsCustom || !selectedTemplate) return
    setCustomTemplates((prev) => prev.filter((item) => item.id !== selectedTemplate.id))
    setSelectedTemplateId('')
  }

  const toggleSidebarPanel = (panel: string) => {
    setOpenSidebarPanel((current) => (current === panel ? null : panel))
  }

  return (
    <div className="space-y-4">
      <section className="cs-card rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/cs/inbox" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to inbox
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              {data?.subject || 'Inquiry'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {data?.type?.toUpperCase()} • {data?.priority?.toUpperCase()} • {statusLabel}
            </p>
            {inChargeLabel && (
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                {inChargeLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canTakeOwnership && (
              <button
                type="button"
                onClick={handleTakeOwnership}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d5c8b8] bg-[#f4ede3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5548] transition hover:border-[#c8b8a5]"
              >
                Take ownership
              </button>
            )}
            {canUpdateStatus && (
              <>
                <select
                  value={activeStatus}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200"
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStatusChange}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 transition hover:border-blue-300 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Update
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <section className="cs-card rounded-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Loading inquiry...
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.senderType === 'STAFF' ? 'Staff' : 'Customer'}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  {(() => {
                    const parsed = item.senderType === 'USER' ? parseStructuredContactMessage(item.message) : null
                    if (!parsed) {
                      return <p className="mt-2 whitespace-pre-line break-words">{item.message}</p>
                    }

                    return (
                      <div className="mt-2 space-y-2">
                        <div className="grid gap-1 text-sm">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Sender</p>
                          <p className="break-words text-slate-800 dark:text-slate-100">
                            {parsed.senderName} <span className="text-slate-600 dark:text-slate-300">&lt;{parsed.senderEmail}&gt;</span>
                          </p>
                          {parsed.topic && (
                            <p className="text-slate-700 dark:text-slate-300">
                              Topic: <span className="font-medium text-slate-800 dark:text-slate-100">{parsed.topic}</span>
                            </p>
                          )}
                        </div>

                        {parsed.fields.length > 0 && (
                          <div className="grid gap-x-4 gap-y-1 border-t border-slate-200 pt-2 text-sm dark:border-white/10 sm:grid-cols-2">
                            {parsed.fields.map((field) => (
                              <div key={`${item.id}-${field.label}`} className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">{field.label}</p>
                                <p className="break-words text-slate-800 dark:text-slate-100">{field.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {parsed.body && (
                          <div className="border-t border-slate-200 pt-2 dark:border-white/10">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Customer message</p>
                            <p className="mt-1 whitespace-pre-line break-words text-slate-800 dark:text-slate-100">{parsed.body}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  No messages yet.
                </div>
              )}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Reply
            </p>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100"
                >
                  <option value="">Quick replies</option>
                  {quickReplyTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('replace')}
                  disabled={!selectedTemplate}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('append')}
                  disabled={!selectedTemplate}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Append
                </button>
                {selectedTemplateIsCustom && (
                  <button
                    type="button"
                    onClick={handleDeleteCustomTemplate}
                    className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 transition dark:border-rose-400/40 dark:text-rose-200"
                  >
                    Delete
                  </button>
                )}
              </div>
              {selectedTemplate && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                  {selectedTemplate.body}
                </p>
              )}
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Write a response to the customer..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100"
            />
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!canSubmitMessage}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
              >
                Send reply
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={customTemplateTitle}
                onChange={(event) => setCustomTemplateTitle(event.target.value)}
                placeholder="Template name"
                className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={!customTemplateTitle.trim() || !message.trim()}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                Save as template
              </button>
            </div>
            {!canReplyResolved && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Missing reply permission for this queue.
              </p>
            )}
          </div>
        </section>

        <section className="cs-card rounded-3xl p-4">
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
          {showReassignSection && (
            <div className="border-b border-slate-200 pb-2 dark:border-white/10">
              <button
                type="button"
                onClick={() => toggleSidebarPanel('reassign')}
                className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
              >
                <span>Reassign case</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSidebarPanel === 'reassign' ? 'rotate-180' : ''}`} />
              </button>
              {openSidebarPanel === 'reassign' && (
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={assigneeStaffId}
                    onChange={(event) => setAssigneeStaffId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200"
                  >
                    <option value="">Select team member</option>
                    {reassignableStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.user.name} ({staff.title || 'Staff'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!assigneeStaffId || assignInquiry.isPending}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>
          )}

          {showEscalationSection && (
            <div className="border-b border-slate-200 py-2 dark:border-white/10">
              <button
                type="button"
                onClick={() => toggleSidebarPanel('escalate')}
                className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200"
              >
                <span>Escalation handoff</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSidebarPanel === 'escalate' ? 'rotate-180' : ''}`} />
              </button>
              {openSidebarPanel === 'escalate' && (
                <>
                  <div className="mt-2 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2 dark:border-amber-400/30 dark:bg-amber-500/10">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">{routingHint.title}</p>
                    <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-100/80">{routingHint.detail}</p>
                    {suggestedDepartment && (
                      <button
                        type="button"
                        onClick={applySuggestedRoute}
                        className="mt-2 rounded-md border border-amber-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:border-amber-400/40 dark:text-amber-100"
                      >
                        Use {suggestedDepartment.name}
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={toDepartmentId}
                      onChange={(event) => setToDepartmentId(event.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-amber-400/30 dark:bg-white/5 dark:text-slate-200"
                    >
                      <option value="">Select target department</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleEscalate}
                      disabled={!toDepartmentId || escalateInquiry.isPending}
                      className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400/40 dark:text-amber-200"
                    >
                      Transfer
                    </button>
                  </div>
                  {availableDepartments.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-200/80">
                      No other active departments available for transfer.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="border-b border-slate-200 py-2 dark:border-white/10">
            <button
              type="button"
              onClick={() => toggleSidebarPanel('timeline')}
              className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b7061]"
            >
              <span>Case timeline</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSidebarPanel === 'timeline' ? 'rotate-180' : ''}`} />
            </button>
            {openSidebarPanel === 'timeline' && (
              <div className="mt-3 space-y-2">
                {audit.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-xs text-[#6b6154]">
                    <span>{actionLabelMap[entry.action] ?? entry.action}</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {audit.length === 0 && (
                  <p className="text-xs text-[#8a7f70]">No timeline entries yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-slate-200 py-2 dark:border-white/10">
            <button
              type="button"
              onClick={() => toggleSidebarPanel('notes')}
              className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
            >
              <span className="inline-flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Internal notes
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSidebarPanel === 'notes' ? 'rotate-180' : ''}`} />
            </button>
            {openSidebarPanel === 'notes' && (
              <div className="mt-2 space-y-2">
                {notes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    <p>{item.note}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    No internal notes yet.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleSidebarPanel('add-note')}
              className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
            >
              <span>Add note</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSidebarPanel === 'add-note' ? 'rotate-180' : ''}`} />
            </button>
            {openSidebarPanel === 'add-note' && (
              <>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Add internal context or next steps..."
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100"
                />
                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!canSubmitNote}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                  >
                    Save note
                  </button>
                </div>
                {!canUpdateStatus && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Missing permission to add internal notes.
                  </p>
                )}
              </>
            )}
          </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CSInquiryDetailPage
