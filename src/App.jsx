import { Navigate, Route, Routes } from "react-router-dom";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";
import VendorPage from "./pages/VendorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student" replace />} />
      <Route path="/student" element={<StudentPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/vendor/:id" element={<VendorPage />} />
    </Routes>
  );
}

export default App;
