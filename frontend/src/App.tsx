import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthRoleSync } from './components/auth/AuthRoleSync'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider } from './context/AuthContext'
import { RoleThemeProvider } from './context/RoleThemeContext'
import { LoginPage } from './pages/LoginPage'
import { RoleBasedHome } from './components/auth/RoleBasedHome'
import { KategoritePage } from './pages/KategoritePage'
import { ProduktePage } from './pages/ProduktePage'
import { FurnitorePage } from './pages/FurnitorePage'
import { PorosiFurnitorePage } from './pages/PorosiFurnitorePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleThemeProvider>
          <AuthRoleSync />
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<RoleBasedHome />} />
                <Route path="kategorite" element={<KategoritePage />} />
                <Route path="produkte" element={<ProduktePage />} />
                <Route path="klientet" element={<PlaceholderPage title="Klientët" />} />
                <Route path="punetoret" element={<PlaceholderPage title="Punëtorët" />} />
                <Route path="furnitore" element={<FurnitorePage />} />
                <Route path="porosi-furnitore" element={<PorosiFurnitorePage />} />
                <Route path="shitjet" element={<PlaceholderPage title="Shitjet" />} />
                <Route path="shitjet/e-re" element={<PlaceholderPage title="Shitje e re" />} />
                <Route path="kthimet" element={<PlaceholderPage title="Kthimet" />} />
                <Route path="ofertat" element={<PlaceholderPage title="Ofertat" />} />
                <Route
                  path="admin/perdoruesit"
                  element={<PlaceholderPage title="Admin — Përdoruesit" />}
                />
                <Route path="admin/rolet" element={<PlaceholderPage title="Admin — Rolet" />} />
              </Route>
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </RoleThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
