export default function LoadingLogUpdateCard() {
  return (
    <div className="p-4 flex flex-col gap-4 w-full rounded-lg bg-white shadow shadow-primary-500/20 border border-green-300 animate-pulse">
      <div className="w-full h-4 bg-gray-400 rounded-lg" />
      <div className="flex flex-col gap-2">
        <div className="w-full h-4 bg-gray-400 rounded-lg pr-8" />
        <div className="w-full h-4 bg-gray-400 rounded-lg pr-16" />
        <div className="w-full h-4 bg-gray-400 rounded-lg pr-12" />
      </div>
    </div>
  );
}
