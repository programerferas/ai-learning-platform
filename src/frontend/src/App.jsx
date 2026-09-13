import {Routes, Route, Navigate ,BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Courses from "./pages/Courses";
import Category from "./pages/Category";
import AboutMe from "./pages/AboutMe";
import Contact from "./pages/Contact";
import CourseDetails from "./pages/CourseDetails";
import VerifyEmail from "./pages/VerifyEmail";
import LessonPage from "./pages/lessonPage/LessonPage";
import QuizPage from "./pages/lessonPage/Quizepage";
import AccountSettings from "./pages/AccountSettings";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import DashboardHome from "./pages/AdminDashboard/DashboardHome";
import UsersPage from "./pages/AdminDashboard/UsersPage";
import CoursesPage from "./pages/AdminDashboard/CoursesPage";
import LessonsPage from "./pages/AdminDashboard/LessonsPage";
import ReviewsPage from "./pages/AdminDashboard/ReviewsPage";
import CategoriesPage from "./pages/AdminDashboard/CategoriesPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotificationsPage from "./pages/AdminDashboard/NotificationsPage";
import ScrollToTop from "./components/ScrollToTop";

// in your routes:

// Existing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

//font
import "./App.css";

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Inter, sans-serif",
          color: "#482349",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );

  return user ? children : <Navigate to="/login" />;
}

// Redirect logged-in users away from auth pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return !user ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Inter, sans-serif",
          color: "#482349",
          fontSize: "14px",
        }}
      >
        Loading admin dashboard...
      </div>
    );

  const isAdmin = user && (user.role === "ADMIN" || user.role === "admin");
  return isAdmin ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/verify-success" element={<VerifyEmail />} />
      <Route path="/verify-failed" element={<VerifyEmail />} />
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/category" element={<Category />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
      <Route path="/aboutme" element={<AboutMe />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/account-settings" element={<AccountSettings />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password/:token" element={<ResetPassword />} />    
      {/* Guest only — redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Protected routes — we'll add pages here step by step */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {/* Step 3 */}
            <div>Dashboard coming soon</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            {/* Step 4 */}
            <div>Profile coming soon</div>
          </ProtectedRoute>
        }
      />
      <Route path="/lessons/:lessonId" element={<LessonPage />} />
      <Route path="/quiz/:courseId" element={<QuizPage />} />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            {/* Step 8 */}
            <div>Settings coming soon</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificate/:id"
        element={
          <ProtectedRoute>
            {/* Step 9 */}
            <div>Certificate coming soon</div>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
