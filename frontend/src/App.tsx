import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoleThemeProvider } from './context/RoleThemeContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <RoleThemeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="kategorite" element={<PlaceholderPage title="Kategoritë" />} />
            <Route path="produkte" element={<PlaceholderPage title="Produktet" />} />
            <Route path="klientet" element={<PlaceholderPage title="Klientët" />} />
            <Route path="punetoret" element={<PlaceholderPage title="Punëtorët" />} />
            <Route path="furnitore" element={<PlaceholderPage title="Furnitorët" />} />
            <Route path="porosi-furnitore" element={<PlaceholderPage title="Porositë e furnitorëve" />} />
            <Route path="shitjet" element={<PlaceholderPage title="Shitjet" />} />
            <Route path="shitjet/e-re" element={<PlaceholderPage title="Shitje e re" />} />
            <Route path="kthimet" element={<PlaceholderPage title="Kthimet" />} />
            <Route path="ofertat" element={<PlaceholderPage title="Ofertat" />} />
            <Route path="admin/perdoruesit" element={<PlaceholderPage title="Admin — Përdoruesit" />} />
            <Route path="admin/rolet" element={<PlaceholderPage title="Admin — Rolet" />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </RoleThemeProvider>
    </BrowserRouter>
  )
}
