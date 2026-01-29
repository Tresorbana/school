import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login.page"
import Signup from "./pages/Signup.page"
import Dashboard from "./pages/Dashboard.page"
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
        }/>

        <Route path="/signup" element={
          <ProtectedRoute authRequired={false}>
            <Signup />
          </ProtectedRoute>
        }/>

        <Route path="/login" element={
          <ProtectedRoute authRequired={false}>
            <Login />
          </ProtectedRoute>
        }/>

        <Route path="/*" element={<Notfound />}/>
      </Routes>
    </>
  )
}

export default App