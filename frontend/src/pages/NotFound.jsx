import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

export default function NotFound({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-txt-3" />
      </div>
      <h1 className="text-xl font-bold text-txt-1 mb-1">404</h1>
      <p className="text-[12px] text-txt-3 mb-6 text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => onBack("dashboard")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-accent text-white hover:bg-accent/90 transition-colors">
          <Home size={11} /> Go to Dashboard
        </button>
        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-txt-3 hover:text-txt-2 hover:bg-bg-3 transition-colors">
          <ArrowLeft size={11} /> Go Back
        </button>
      </div>
    </div>
  );
}
