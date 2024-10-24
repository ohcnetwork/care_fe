import { useEffect, useRef } from "react";

export default function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    contextRef.current = context as CanvasRenderingContext2D;
  }, []);

  return { canvasRef, contextRef };
}
