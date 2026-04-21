import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAppStore } from "./context/appStore";

// Move StudentPage back to standard import for reliable initial screen
import StudentPage from "./pages/StudentPage";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const VendorPage = lazy(() => import("./pages/VendorPage"));

function App() {
  const initialize = useAppStore(state => state.initialize);
  const location = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    try {
      console.log("Initializing App Store...");
      initialize();
    } catch (err) {
      console.error("Store Init Error: ", err);
    }
  }, [initialize, location]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ height: '100vh', background: 'white' }} />}>
        <Routes>
          <Route path="/" element={<Navigate to="/student" replace />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/vendor" element={<Navigate to="/vendor/1" replace />} />
          <Route path="/vendor/:id" element={<VendorPage />} />
          <Route path="*" element={
            <div style={{ padding: 50, background: 'white', color: '#333', textAlign: 'center', height: '100vh' }}>
              <h1 style={{ color: '#00A15E' }}>404: Not Found</h1>
              <p>We couldn't find the page: <strong>{location}</strong></p>
              <button 
                onClick={() => window.location.href = '/'}
                style={{ marginTop: 20, padding: '10px 20px', background: '#00A15E', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold' }}
              >
                Go Home
              </button>
            </div>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
