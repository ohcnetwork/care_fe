export default function LoadingLogUpdateCard() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-4 rounded-lg border border-green-300 bg-white p-4 shadow shadow-primary-500/20">
      <div className="h-4 w-full rounded-lg bg-gray-400" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full rounded-lg bg-gray-400 pr-8" />
        <div className="h-4 w-full rounded-lg bg-gray-400 pr-16" />
        <div className="h-4 w-full rounded-lg bg-gray-400 pr-12" />
      </div>
    </div>
  );
}
