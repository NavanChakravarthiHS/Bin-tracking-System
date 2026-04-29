import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { acceptTokenFromUrlHash, clearToken, fetchAdminMe, getToken, goToLogin } from "../../auth/adminAuth";

const RequireAdmin = () => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    async function run() {
      acceptTokenFromUrlHash();
      const token = getToken();
      if (!token) return goToLogin();

      const me = await fetchAdminMe(token);
      if (!alive) return;
      if (!me) {
        clearToken();
        return goToLogin();
      }
      setChecking(false);
    }

    run().catch(() => {
      clearToken();
      goToLogin();
    });

    return () => {
      alive = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-700">
        <div className="modern-card px-6 py-4">Checking admin session…</div>
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAdmin;

