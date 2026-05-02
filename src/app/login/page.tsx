import { Suspense } from "react";
import LoginPage from "./LoginPage";
import { Loader2 } from "lucide-react";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <LoginPage />
    </Suspense>
  );
}
