import { useState, useRef } from "react";
import { Upload, X, File } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number;
  variant?: "default" | "verification";
}

export function FileUpload({ onFileSelect, selectedFile, accept = "*", maxSize = 5 * 1024 * 1024, variant = "default" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }
    
    onFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const borderColor = variant === "verification" ? "border-secondary" : "border-primary";
  const hoverBorderColor = variant === "verification" ? "hover:border-secondary" : "hover:border-primary";
  const iconColor = variant === "verification" ? "text-secondary" : "text-primary";

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {selectedFile ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-700">{selectedFile.name}</p>
                <p className="text-sm text-text-secondary">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="text-error hover:text-error"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging ? `${borderColor} bg-blue-50` : `border-gray-300 ${hoverBorderColor}`
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn("w-12 h-12 mx-auto mb-4", isDragging ? iconColor : "text-gray-400")} />
          <p className="text-lg font-medium text-gray-700">
            {variant === "verification" ? "Upload image to verify" : "Drop your image here"}
          </p>
          <p className="text-text-secondary">
            {variant === "verification" ? "System will extract embedded signature" : "or click to browse files"}
          </p>
          <p className="text-sm text-text-secondary mt-2">
            Supports PNG, JPEG (max {maxSize / (1024 * 1024)}MB)
          </p>
          <Button 
            className={cn(
              "mt-4",
              variant === "verification" 
                ? "bg-secondary text-white hover:bg-secondary/90" 
                : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {variant === "verification" ? "Choose File to Verify" : "Choose File"}
          </Button>
        </div>
      )}
    </div>
  );
}
