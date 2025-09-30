export function TimelineWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pb-6">
      <div className="absolute left-3.5 top-12 bottom-2 w-0.5 bg-gray-200" />
      <div className="absolute left-3.5 bottom-2 h-0.5 w-7 -translate-x-[13px] bg-gray-200 rounded" />
      {children}
    </div>
  );
}
