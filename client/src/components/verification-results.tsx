import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VerificationResultsProps {
  result: {
    isValid: boolean;
    imageId?: number;
    extractedSignature?: string;
    integrityScore: number;
    method: string;
    errorMessage?: string;
    imageMetadata?: {
      artistName: string;
      artworkTitle: string;
      creationDate: string;
    };
  };
}

export function VerificationResults({ result }: VerificationResultsProps) {
  const getStatusColor = () => {
    if (result.isValid) return "bg-green-50 border-green-200";
    if (result.integrityScore > 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getStatusIcon = () => {
    if (result.isValid) return <CheckCircle className="text-secondary text-xl" />;
    if (result.integrityScore > 50) return <AlertTriangle className="text-accent text-xl" />;
    return <XCircle className="text-error text-xl" />;
  };

  const getStatusText = () => {
    if (result.isValid) return "AUTHENTIC";
    if (result.integrityScore > 50) return "SUSPICIOUS";
    return "INVALID";
  };

  const getStatusMessage = () => {
    if (result.isValid) return "Verification Successful";
    if (result.integrityScore > 50) return "Partial Signature Found";
    return "Verification Failed";
  };

  return (
    <Card className={`mt-6 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="font-medium text-gray-900 ml-3">{getStatusMessage()}</span>
          </div>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            result.isValid 
              ? "bg-secondary text-white" 
              : result.integrityScore > 50 
                ? "bg-accent text-white"
                : "bg-error text-white"
          }`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          {result.imageMetadata && (
            <>
              <div className="flex justify-between">
                <span className="text-text-secondary">Artist:</span>
                <span className="font-medium">{result.imageMetadata.artistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Title:</span>
                <span className="font-medium">{result.imageMetadata.artworkTitle}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Signature Match:</span>
            <span className={`font-medium ${result.isValid ? "text-secondary" : "text-error"}`}>
              {result.isValid ? "✓ Valid" : "✗ Invalid"}
            </span>
          </div>
          
          {result.imageId && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Database Record:</span>
              <span className="text-secondary font-medium">✓ Found</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Integrity:</span>
            <span className={`font-medium ${
              result.integrityScore > 80 
                ? "text-secondary" 
                : result.integrityScore > 50 
                  ? "text-accent"
                  : "text-error"
            }`}>
              {result.integrityScore}%
            </span>
          </div>
          
          {result.errorMessage && (
            <div className="mt-3 p-2 bg-red-100 rounded text-error text-sm">
              {result.errorMessage}
            </div>
          )}
        </div>
        
        {result.imageId && (
          <Button 
            className="w-full mt-4 bg-accent text-white hover:bg-accent/90"
            onClick={() => {
              // This would trigger attack simulation
              window.dispatchEvent(new CustomEvent('runAttackSimulation', { detail: { imageId: result.imageId } }));
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Run Attack Simulation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
