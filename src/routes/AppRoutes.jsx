import React from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AdminRoute } from '../components/AdminRoute'
import { UserLayout } from '../layouts/UserLayout'
import { AdminLayout } from '../layouts/AdminLayout'

// ── Public Pages ─────────────────────────────────────────────────────────────
import { LandingPage }        from '../pages/public/LandingPage'
import { LoginPage }          from '../pages/public/LoginPage'
import { RegisterPage }       from '../pages/public/RegisterPage'
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage'

// ── User Pages (existing) ─────────────────────────────────────────────────────
import { UserDashboard }      from '../pages/user/UserDashboard'
import { PaperListPage }      from '../pages/user/PaperListPage'
import { PaperDetailPage }    from '../pages/user/PaperDetailPage'
import { ExamPage }           from '../pages/user/ExamPage'
import { ResultPage }         from '../pages/user/ResultPage'
import { QuestionReviewPage } from '../pages/user/QuestionReviewPage'
import { AttemptHistoryPage } from '../pages/user/AttemptHistoryPage'
import { CompareAttemptsPage }from '../pages/user/CompareAttemptsPage'

// ── User Pages (TNPSC new) ────────────────────────────────────────────────────
import { CurrentAffairsPage } from '../pages/user/CurrentAffairsPage'
import { GovtUpdatesPage }    from '../pages/user/GovtUpdatesPage'
import { PracticePage }       from '../pages/user/PracticePage'
import { MockTestsPage }      from '../pages/user/MockTestsPage'
import { SyllabusPage }       from '../pages/user/SyllabusPage'
import { AnalyticsPage }      from '../pages/user/AnalyticsPage'
import { NotesPage }          from '../pages/user/NotesPage'
import { BYOPPage }           from '../pages/user/BYOPPage'
import { ProfilePage }        from '../pages/user/ProfilePage'
import { HelpContactPage }    from '../pages/user/HelpContactPage'

// ── Admin Pages ───────────────────────────────────────────────────────────────
import { AdminDashboard }         from '../pages/admin/AdminDashboard'
import { QuestionManagementPage } from '../pages/admin/QuestionManagementPage'
import { ImportQuestionsPage }    from '../pages/admin/ImportQuestionsPage'
import { AdminPricingPage }       from '../pages/admin/AdminPricingPage'
// TNPSC Admin CMS pages
import { AdminCurrentAffairsPage } from '../pages/admin/AdminCurrentAffairsPage'
import { AdminNotificationsPage }  from '../pages/admin/AdminNotificationsPage'
import { AdminRecallPage }         from '../pages/admin/AdminRecallPage'
import { AdminUsersPage }          from '../pages/admin/AdminUsersPage'
import { AdminAnalyticsPage }      from '../pages/admin/AdminAnalyticsPage'
import { AdminSettingsPage }       from '../pages/admin/AdminSettingsPage'
import { AdminExtractedQuestionsPage } from '../pages/admin/AdminExtractedQuestionsPage'

// Convert to route objects for createBrowserRouter (required for useBlocker)
export function createAppRoutes() {
  return [
    // ── Public ──
    { path: '/', element: <LandingPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/admin/login', element: <LoginPage isAdminLogin={true} /> },

    // ── User (protected, inside UserLayout with TNPSC sidebar) ──
    {
      element: <ProtectedRoute><UserLayout /></ProtectedRoute>,
      children: [
        { path: '/dashboard', element: <UserDashboard /> },
        { path: '/papers', element: <PaperListPage /> },
        { path: '/papers/:paperId', element: <PaperDetailPage /> },
        { path: '/attempt/:attemptId', element: <ResultPage /> },
        { path: '/attempt/:attemptId/result', element: <ResultPage /> },
        { path: '/attempt/:attemptId/review', element: <QuestionReviewPage /> },
        { path: '/my-attempts', element: <AttemptHistoryPage /> },
        { path: '/compare/:paperId', element: <CompareAttemptsPage /> },
        { path: '/practice', element: <PracticePage /> },
        { path: '/mock-tests', element: <MockTestsPage /> },
        { path: '/syllabus', element: <SyllabusPage /> },
        { path: '/analytics', element: <AnalyticsPage /> },
        { path: '/current-affairs', element: <CurrentAffairsPage /> },
        { path: '/govt-updates', element: <GovtUpdatesPage /> },
        { path: '/my-papers', element: <BYOPPage /> },
        { path: '/notes', element: <NotesPage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/help', element: <HelpContactPage /> },
      ]
    },

    // ── Fullscreen Exam (no sidebar) ──
    { path: '/exam/:paperId', element: <ProtectedRoute><ExamPage /></ProtectedRoute> },

    // ── Admin ──
    {
      element: <AdminRoute><AdminLayout /></AdminRoute>,
      children: [
        { path: '/admin', element: <AdminDashboard /> },
        { path: '/admin/papers', element: <Navigate to="/admin/questions" replace /> },
        { path: '/admin/papers/create', element: <Navigate to="/admin/questions?newPaper=1" replace /> },
        { path: '/admin/papers/:paperId/edit', element: <Navigate to="/admin/questions" replace /> },
        { path: '/admin/papers/:paperId/questions', element: <QuestionManagementPage /> },
        { path: '/admin/papers/:paperId/import', element: <ImportQuestionsPage /> },
        { path: '/admin/attempts', element: <Navigate to="/admin/pricing" replace /> },
        { path: '/admin/syllabus', element: <Navigate to="/admin/questions" replace /> },
        { path: '/admin/pricing', element: <AdminPricingPage /> },
        { path: '/admin/current-affairs', element: <AdminCurrentAffairsPage /> },
        { path: '/admin/notifications', element: <AdminNotificationsPage /> },
        { path: '/admin/recall', element: <AdminRecallPage /> },
        { path: '/admin/users', element: <AdminUsersPage /> },
        { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
        { path: '/admin/settings', element: <AdminSettingsPage /> },
        { path: '/admin/questions', element: <AdminExtractedQuestionsPage /> },
        { path: '/admin/extracted-questions', element: <AdminExtractedQuestionsPage /> },
      ]
    },

    // Catch-all
    { path: '*', element: <Navigate to="/" replace /> }
  ]
}
