import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/guards/ProtectedRoute'
import type { PortalAccessState, PortalMode } from '@/app/routing/portal-rules'
import type { User } from '@/store/auth.store'

const Layout = lazy(() => import('@/components/layout/Layout'))

const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ClerkLoginPage = lazy(() => import('@/features/auth/pages/ClerkLoginPage'))
const ClerkRegisterPage = lazy(() => import('@/features/auth/pages/ClerkRegisterPage'))
const BooksPage = lazy(() => import('@/features/books/pages/BooksPage'))
const BookDetailPage = lazy(() => import('@/features/books/pages/BookDetailPage'))
const CartPage = lazy(() => import('@/features/commerce/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/features/commerce/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/features/commerce/pages/OrderConfirmationPage'))
const OrdersPage = lazy(() => import('@/features/commerce/pages/OrdersPage'))
const RewardsPage = lazy(() => import('@/features/commerce/pages/RewardsPage'))
const ProfileSettingsPage = lazy(() => import('@/features/profile/settings/pages/ProfileSettingsPage'))
const LibraryPage = lazy(() => import('@/features/library/pages/LibraryPage'))
const MyBooksPage = lazy(() => import('@/features/library/pages/MyBooksPage'))
const BookReaderPage = lazy(() => import('@/features/book-reader/pages/BookReaderPage'))
const ContactPage = lazy(() => import('@/features/site/contact/pages/ContactPage'))
const ContactSupportPage = lazy(() => import('@/features/site/contact/pages/ContactSupportPage'))
const PrivacyPage = lazy(() => import('@/features/site/legal/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/features/site/legal/pages/TermsPage'))
const AuthorBlogsPage = lazy(() => import('@/features/blog/pages/AuthorBlogsPage'))
const BlogWritePage = lazy(() => import('@/features/blog/write/BlogWritePage'))
const MyWritingPage = lazy(() => import('@/features/blog/pages/MyWritingPage'))
const BlogDetailPage = lazy(() => import('@/features/blog/pages/BlogDetailPage'))
const BlogSupportPage = lazy(() => import('@/features/blog/pages/BlogSupportPage'))
const UserProfilePage = lazy(() => import('@/features/profile/public/pages/UserProfilePage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const PortalSelectPage = lazy(() => import('@/features/auth/pages/PortalSelectPage'))

type IndexProps = {
  isAuthenticated: boolean
  user: User | null
  portalMode: PortalMode
  portalAccess: PortalAccessState
}

type StaticAuthProps = {
  isAuthenticated: boolean
  portalAccess: PortalAccessState
}

type BooksProps = {
  portalAccess: PortalAccessState
}

type BuyerRoutesProps = {
  portalAccess: PortalAccessState
}

const renderIndexRoute = ({ isAuthenticated, user, portalMode, portalAccess }: IndexProps) => (
  <Route
    index
    element={
      isAuthenticated && portalAccess.canUseCS && (user?.role === 'USER' || portalAccess.isStaffLinkedUser)
        ? <Navigate to="/cs" replace />
        : isAuthenticated && portalAccess.isDualPortalUser && !portalMode
          ? <Navigate to="/portal-select" replace />
          : isAuthenticated && portalAccess.hasStaffPortalAccess && (!portalAccess.isBuyerSession || portalAccess.isStaffLinkedUser)
            ? <Navigate to={portalAccess.staffPortalPath} replace />
            : <HomePage />
    }
  />
)

const renderStaticAuthRoutes = ({ isAuthenticated, portalAccess }: StaticAuthProps) => (
  <>
    <Route path="login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
    <Route path="register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
    <Route
      path="auth-testing/clerk/login/*"
      element={isAuthenticated ? <Navigate to="/" replace /> : <ClerkLoginPage />}
    />
    <Route
      path="auth-testing/clerk/register/*"
      element={isAuthenticated ? <Navigate to="/" replace /> : <ClerkRegisterPage />}
    />
    <Route
      path="portal-select"
      element={
        isAuthenticated && portalAccess.isDualPortalUser
          ? <PortalSelectPage />
          : <Navigate to="/" replace />
      }
    />
  </>
)

const renderBlogRoutes = () => (
  <>
    <Route path="author-blogs" element={<Navigate to="/blogs" replace />} />
    <Route path="blogs" element={<AuthorBlogsPage />} />
    <Route path="blogs/:id" element={<BlogDetailPage />} />
    <Route path="blogs/:id/support" element={<BlogSupportPage />} />
    <Route
      path="blogs/write"
      element={<ProtectedRoute><BlogWritePage /></ProtectedRoute>}
    />
    <Route
      path="blogs/mine"
      element={<ProtectedRoute><MyWritingPage /></ProtectedRoute>}
    />
  </>
)

const renderBookRoutes = ({ portalAccess }: BooksProps) => (
  <>
    <Route
      path="books"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.canUseAdmin ? '/admin/books' : portalAccess.staffPortalPath} replace />
          : <BooksPage />
      }
    />
    <Route
      path="books/:id"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.canUseAdmin ? '/admin/books' : portalAccess.staffPortalPath} replace />
          : <BookDetailPage />
      }
    />
  </>
)

const renderContactRoutes = () => (
  <>
    <Route path="contact" element={<ContactPage />} />
    <Route path="contact/support" element={<ContactSupportPage />} />
    <Route path="contact/authors" element={<Navigate to="/contact/support" replace />} />
    <Route path="contact/publishers" element={<Navigate to="/contact/support" replace />} />
    <Route path="contact/business" element={<Navigate to="/contact/support" replace />} />
    <Route path="contact/legal" element={<Navigate to="/contact/support" replace />} />
  </>
)

const renderLegalRoutes = () => (
  <>
    <Route path="privacy" element={<PrivacyPage />} />
    <Route path="terms" element={<TermsPage />} />
  </>
)

const renderProfileRoutes = () => <Route path="user/:id" element={<UserProfilePage />} />

const renderBuyerRoutes = ({ portalAccess }: BuyerRoutesProps) => (
  <>
    <Route
      path="cart"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.staffPortalPath} replace />
          : <ProtectedRoute><CartPage /></ProtectedRoute>
      }
    />
    <Route
      path="checkout"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.staffPortalPath} replace />
          : <ProtectedRoute><CheckoutPage /></ProtectedRoute>
      }
    />
    <Route
      path="order-confirmation/:orderId"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.staffPortalPath} replace />
          : <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>
      }
    />
    <Route
      path="orders"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.canUseAdmin ? '/admin/orders' : portalAccess.staffPortalPath} replace />
          : <ProtectedRoute><OrdersPage /></ProtectedRoute>
      }
    />
    <Route
      path="rewards"
      element={
        portalAccess.hasStaffPortalAccess && !portalAccess.isBuyerSession
          ? <Navigate to={portalAccess.staffPortalPath} replace />
          : <ProtectedRoute><RewardsPage /></ProtectedRoute>
      }
    />
    <Route path="profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
    <Route path="settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
    <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
    <Route path="reading-insights" element={<ProtectedRoute><MyBooksPage /></ProtectedRoute>} />
    <Route path="my-books" element={<Navigate to="/reading-insights" replace />} />
    <Route path="my-books/:id/read" element={<ProtectedRoute><BookReaderPage /></ProtectedRoute>} />
  </>
)

const renderPublicChildRoutes = (props: IndexProps & StaticAuthProps & BooksProps & BuyerRoutesProps) => (
  <>
    {renderIndexRoute(props)}
    {renderStaticAuthRoutes(props)}
    {renderBlogRoutes()}
    {renderBookRoutes(props)}
    {renderContactRoutes()}
    {renderLegalRoutes()}
    {renderProfileRoutes()}
    {renderBuyerRoutes(props)}
  </>
)

export { Layout, renderPublicChildRoutes }
