import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { AttackSimulation } from "@/components/attack-simulation";
import { VerificationResults } from "@/components/verification-results";
import { AuthenticationTrends } from "@/components/charts/authentication-trends";
import { AttackResistance } from "@/components/charts/attack-resistance";
import { Images, CheckCircle, Bug, Database, CloudUpload, Search, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [authMetadata, setAuthMetadata] = useState({
    artistName: "",
    artworkTitle: "",
    creationDate: "",
    signatureType: "RSA-2048"
  });

  // Fetch dashboard statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Authentication mutation
  const authenticateMutation = useMutation({
    mutationFn: async (data: { file: File; metadata: any }) => {
      const formData = new FormData();
      formData.append('image', data.file);
      formData.append('metadata', JSON.stringify(data.metadata));
      
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image authenticated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedFile(null);
      setAuthMetadata({
        artistName: "",
        artworkTitle: "",
        creationDate: "",
        signatureType: "RSA-2048"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to authenticate image",
        variant: "destructive",
      });
    },
  });

  // Verification mutation
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleAuthenticate = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (!authMetadata.artistName || !authMetadata.artworkTitle || !authMetadata.creationDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    authenticateMutation.mutate({ file: selectedFile, metadata: authMetadata });
  };

  const handleVerification = () => {
    if (!verificationFile) {
      toast({
        title: "Error",
        description: "Please select an image to verify",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate(verificationFile);
  };

  if (statsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Image Authentication Platform</h1>
        <p className="text-text-secondary">Secure steganographic embedding and verification system with attack simulation</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Authenticated</p>
                <p className="text-2xl font-bold text-gray-900">{(stats as any)?.totalAuthenticated || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Images className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-secondary font-medium">+{(stats as any)?.growthRate || 0}%</span>
              <span className="text-text-secondary ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Verified Today</p>
                <p className="text-2xl font-bold text-gray-900">{(stats as any)?.verifiedToday || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-secondary text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-secondary font-medium">{(stats as any)?.verificationRate || 0}%</span>
              <span className="text-text-secondary ml-2">verification rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Attack Simulations</p>
                <p className="text-2xl font-bold text-gray-900">{(stats as any)?.attackSimulations || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bug className="text-accent text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-error font-medium">{(stats as any)?.attackResistance || 0}%</span>
              <span className="text-text-secondary ml-2">resistance rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Database Size</p>
                <p className="text-2xl font-bold text-gray-900">{(stats as any)?.databaseSize || "0 MB"}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-text-secondary">Neon PostgreSQL</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Image Authentication Panel */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center">
              <CloudUpload className="text-primary mr-3" />
              Image Authentication
            </CardTitle>
            <p className="text-text-secondary">Upload and embed digital signatures into images</p>
          </CardHeader>
          <CardContent className="p-6">
            <FileUpload
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              accept="image/*"
              maxSize={100 * 1024 * 1024}
            />

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  placeholder="Enter artist name"
                  value={authMetadata.artistName}
                  onChange={(e) => setAuthMetadata({ ...authMetadata, artistName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="artworkTitle">Artwork Title</Label>
                <Input
                  id="artworkTitle"
                  placeholder="Enter artwork title"
                  value={authMetadata.artworkTitle}
                  onChange={(e) => setAuthMetadata({ ...authMetadata, artworkTitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creationDate">Creation Date</Label>
                  <Input
                    id="creationDate"
                    type="date"
                    value={authMetadata.creationDate}
                    onChange={(e) => setAuthMetadata({ ...authMetadata, creationDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="signatureType">Signature Type</Label>
                  <Select value={authMetadata.signatureType} onValueChange={(value) => setAuthMetadata({ ...authMetadata, signatureType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RSA-2048">RSA-2048</SelectItem>
                      <SelectItem value="ECDSA-256">ECDSA-256</SelectItem>
                      <SelectItem value="RSA-4096">RSA-4096</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleAuthenticate} 
                className="w-full bg-primary text-white hover:bg-primary/90"
                disabled={authenticateMutation.isPending}
              >
                <Key className="w-4 h-4 mr-2" />
                {authenticateMutation.isPending ? "Authenticating..." : "Generate Keys & Authenticate Image"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Panel */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center">
              <Search className="text-secondary mr-3" />
              Image Verification
            </CardTitle>
            <p className="text-text-secondary">Verify authenticity of steganographic images</p>
          </CardHeader>
          <CardContent className="p-6">
            <FileUpload
              onFileSelect={setVerificationFile}
              selectedFile={verificationFile}
              accept="image/*"
              maxSize={100 * 1024 * 1024}
              variant="verification"
            />

            {verifyMutation.data && (
              <VerificationResults result={verifyMutation.data} />
            )}

            <Button 
              onClick={handleVerification}
              className="w-full mt-4 bg-secondary text-white hover:bg-secondary/90"
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Upload for Verification"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attack Simulation Dashboard */}
      <AttackSimulation />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
              Security Analytics
            </CardTitle>
            <p className="text-text-secondary">Performance metrics and security insights</p>
          </CardHeader>
          <CardContent>
            <AuthenticationTrends />
            <div className="mt-6">
              <AttackResistance />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Average Processing Time</span>
                <span className="font-medium">{(stats as any)?.avgProcessingTime || "2.3s"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">System Uptime</span>
                <span className="font-medium text-secondary">{(stats as any)?.uptime || "99.9%"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Active Sessions</span>
                <span className="font-medium">{(stats as any)?.activeSessions || "47"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
