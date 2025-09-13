import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { VerificationResults } from "@/components/verification-results";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Verification() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify image",
        variant: "destructive",
      });
    },
  });

  const handleVerification = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image to verify",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate(selectedFile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Verification</h1>
        <p className="text-text-secondary">Verify the authenticity of steganographic images using embedded digital signatures</p>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center">
            <Search className="text-secondary mr-3" />
            Upload Image for Verification
          </CardTitle>
          <p className="text-text-secondary">Our system will extract and verify the embedded digital signature</p>
        </CardHeader>
        <CardContent className="p-6">
          <FileUpload
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            accept="image/*"
            maxSize={100 * 1024 * 1024}
            variant="verification"
          />

          {verifyMutation.data && (
            <VerificationResults result={verifyMutation.data} />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleVerification}
              disabled={verifyMutation.isPending || !selectedFile}
              className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Image Authenticity"}
            </button>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">How Verification Works</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                <p>Our system extracts the embedded digital signature from the image's LSB (Least Significant Bits)</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                <p>The extracted signature is verified against our database of authenticated images</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                <p>Cryptographic verification ensures the image hasn't been tampered with since authentication</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
                <p>Results show authenticity status, artist information, and integrity score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
