import { AuthProvider } from "./providers/AuthProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "../components/ui/sonner";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster closeButton position="top-right" richColors />
      </AuthProvider>
    </QueryProvider>
  );
}
