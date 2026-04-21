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
      alert("APP MOUNTED - Path: " + location);
      initialize();
    } catch (err) {
      alert("Store Init Error: " + err.message);
    }
  }, [initialize, location]);

  alert("RENDERING APP COMPONENT...");

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div style={{ padding: 50, textAlign: 'center', background: 'white', height: '100vh' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #00A15E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: 20, color: '#666' }}>Loading Verde App...</p>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to="/student" replace />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/vendor/:id" element={<VendorPage />} />
          <Route path="*" element={
            <div style={{ padding: 50, background: 'red', color: 'white' }}>
              <h1>404: Route Not Matched</h1>
              <p>Current Path: {location}</p>
              <button onClick={() => window.location.href = '/'}>Go Home</button>
            </div>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
