import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login.page"
import Signup from "./pages/Signup.page"
import Dashboard from "./pages/Dashboard.page"
import MarksEntry from "./pages/MarksEntry.page"
import ReportCards from "./pages/ReportCards.page"
import Notfound from "./pages/Notfound.page"
import ProtectedRoute from "./components/auth/ProtectedRoute"

function App() {
  return (
    <>
      {/* Routes */}
      <Routes>
        <Route path="/" element={
          <ProtectedRoute authRequired={true}>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/signup" element={
          <ProtectedRoute authRequired={false}>
            <Signup />
          </ProtectedRoute>
        } />

        <Route path="/login" element={
          <ProtectedRoute authRequired={false}>
            <Login />
          </ProtectedRoute>
        } />

        <Route path="/marks" element={
          <ProtectedRoute authRequired={true}>
            <MarksEntry />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute authRequired={true}>
            <ReportCards />
          </ProtectedRoute>
        } />

        <Route path="/*" element={<Notfound />} />
      </Routes>
    </>
  )
}

export default App