import { lazy } from 'react'
import { Route } from 'react-router-dom'
import CSRoute from '@/components/guards/CSRoute'

const CSLayout = lazy(() => import('@/components/cs/CSLayout'))
const CSDashboardPage = lazy(() => import('@/features/cs/pages/CSDashboardPage'))
const CSInboxPage = lazy(() => import('@/features/cs/pages/CSInboxPage'))
const CSInquiryDetailPage = lazy(() => import('@/features/cs/pages/CSInquiryDetailPage'))
const CSEscalationsPage = lazy(() => import('@/features/cs/pages/CSEscalationsPage'))
const CSKnowledgePage = lazy(() => import('@/features/cs/pages/CSKnowledgePage'))
const CSTeamPage = lazy(() => import('@/features/cs/pages/CSTeamPage'))

const renderCSRoutes = () => (
  <Route
    path="/cs"
    element={
      <CSRoute>
        <CSLayout />
      </CSRoute>
    }
  >
    <Route index element={<CSDashboardPage />} />
    <Route path="inbox" element={<CSInboxPage mode="inbox" />} />
    <Route path="inquiries" element={<CSInboxPage mode="inquiries" />} />
    <Route path="inquiries/:id" element={<CSInquiryDetailPage />} />
    <Route path="escalations" element={<CSEscalationsPage />} />
    <Route path="team" element={<CSTeamPage />} />
    <Route path="knowledge" element={<CSKnowledgePage />} />
  </Route>
)

export default renderCSRoutes
