import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DebugPreviewProps {
  data: unknown;
  title?: string;
  className?: string;
}

export function DebugPreview({ data, title, className }: DebugPreviewProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {title || "Debug Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm text-gray-500 whitespace-pre-wrap overflow-auto max-h-[500px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
