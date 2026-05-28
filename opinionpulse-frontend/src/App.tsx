import { Route, Routes } from "react-router-dom"
import { LandingPage } from "@/pages/LandingPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PlaceholderPage title="Login" />} />
      <Route path="/signup" element={<PlaceholderPage title="Sign Up" />} />
      <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
    </Routes>
  )
}

export default App
