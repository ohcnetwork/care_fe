import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SyncBannerProps {
  isVisible: boolean;
  syncedCount: number;
  totalCount: number;
  onComplete?: () => void;
}

export function SyncBanner({
  isVisible,
  syncedCount,
  totalCount,
  onComplete,
}: SyncBannerProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isVisible && syncedCount === totalCount && totalCount > 0) {
      setIsCompleted(true);

      const timer = setTimeout(() => {
        onComplete?.();
        setIsCompleted(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, syncedCount, totalCount, onComplete]);

  if (!isVisible || totalCount === 0) return null;

  if (!isVisible || totalCount === 0) return null;

  const progress = totalCount > 0 ? (syncedCount / totalCount) * 100 : 0;
  const circumference = 2 * Math.PI * 16;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke="#e5e7eb"
              strokeWidth="2"
              fill="none"
            />

            <circle
              cx="18"
              cy="18"
              r="16"
              stroke={isCompleted ? "#10b981" : "#3b82f6"}
              strokeWidth="2"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {isCompleted
              ? `Synced ${syncedCount} Records`
              : `Syncing ${syncedCount} Offline Records...`}
          </div>
          {!isCompleted && (
            <div className="text-xs text-gray-500 mt-1">
              {syncedCount} of {totalCount} completed
            </div>
          )}
          {isCompleted && (
            <div className="text-xs text-green-600 mt-1 font-medium">
              Sync completed successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
