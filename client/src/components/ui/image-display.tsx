import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageDisplayProps {
  imageData: string;
  alt: string;
  className?: string;
}

export function ImageDisplay({ imageData, alt, className }: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !imageData) {
    return (
      <div className={cn("bg-gray-200 flex items-center justify-center", className)}>
        <span className="text-gray-400 text-xs">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={`data:image/png;base64,${imageData}`}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}
