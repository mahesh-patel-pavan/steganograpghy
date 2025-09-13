import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Key, Clock, User, Image as ImageIcon, Shield, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageMetadata {
  id: number;
  artistName: string;
  artworkTitle: string;
  originalFilename: string;
  fileSize: number;
  imageFormat: string;
  creationDate: string;
  authenticationDate: string;
  publicKey: string;
  privateKey: string;
  signatureType: string;
  signatureHash: string;
  embedPositions: number[];
  integrityMetrics: {
    totalPixels: number;
    modifiedPixels: number;
    embeddingStrength: number;
  };
}

interface DisputeData {
  imageId: number;
  chronologicalRank: number;
  similarArtworks: Array<{
    id: number;
    artistName: string;
    artworkTitle: string;
    creationDate: string;
    similarity: number;
  }>;
}

export default function Metadata() {
  const { toast } = useToast();
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/ledger'],
    select: (data: any) => data.items
  });

  const { data: metadata, isLoading: metadataLoading } = useQuery<ImageMetadata>({
    queryKey: ['/api/metadata', selectedImageId],
    enabled: !!selectedImageId
  });

  const { data: disputeData } = useQuery<DisputeData>({
    queryKey: ['/api/dispute-analysis', selectedImageId],
    enabled: !!selectedImageId
  });

  const downloadKey = async (keyType: 'public' | 'private') => {
    if (!selectedImageId || !metadata) return;

    try {
      const response = await fetch(`/api/download/key/${selectedImageId}?type=${keyType}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.artistName}_${metadata.artworkTitle}_${keyType}_key.pem`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${keyType === 'public' ? 'Public' : 'Private'} key downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download ${keyType} key`,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Metadata & Forensics</h1>
        <p className="text-text-secondary">View detailed metadata, download cryptographic keys, and analyze ownership disputes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="text-primary mr-3" />
              Select Image
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {imagesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {images?.map((image: any) => (
                  <div
                    key={image.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedImageId === image.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedImageId(image.id)}
                  >
                    <div className="font-medium text-sm">{image.artworkTitle}</div>
                    <div className="text-xs text-text-secondary">{image.artistName}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      Created: {new Date(image.creationDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedImageId ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-text-secondary">Select an image to view detailed metadata</p>
              </CardContent>
            </Card>
          ) : metadataLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : metadata ? (
            <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="text-primary mr-3" />
                    Artwork Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Artist Name</label>
                      <p className="text-lg font-semibold">{metadata.artistName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Artwork Title</label>
                      <p className="text-lg font-semibold">{metadata.artworkTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Creation Date</label>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        {formatDate(metadata.creationDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Authentication Date</label>
                      <p className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                        {formatDate(metadata.authenticationDate)}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">File Size</label>
                      <p>{formatFileSize(metadata.fileSize)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Format</label>
                      <Badge variant="secondary">{metadata.imageFormat}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Signature Type</label>
                      <Badge variant="outline">{metadata.signatureType}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cryptographic Keys */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="text-primary mr-3" />
                    Cryptographic Keys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Public Key</label>
                    <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                      {metadata.publicKey.substring(0, 100)}...
                    </code>
                    <Button 
                      onClick={() => downloadKey('public')} 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Public Key
                    </Button>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <label className="text-sm font-medium text-red-700 mb-2 block">Private Key (Sensitive)</label>
                    <code className="text-xs bg-white p-2 rounded border block">
                      ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </code>
                    <Button 
                      onClick={() => downloadKey('private')} 
                      variant="destructive" 
                      size="sm"
                      className="mt-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Private Key
                    </Button>
                    <p className="text-xs text-red-600 mt-1">⚠️ Private keys are sensitive. Only share with authorized parties.</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-blue-700">Signature Hash</label>
                    <code className="text-xs text-blue-800 block mt-1 break-all">
                      {metadata.signatureHash}
                    </code>
                  </div>
                </CardContent>
              </Card>

              {/* Steganographic Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="text-primary mr-3" />
                    Steganographic Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Pixels</label>
                      <p className="text-lg font-semibold">{metadata.integrityMetrics?.totalPixels?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Modified Pixels</label>
                      <p className="text-lg font-semibold">{metadata.integrityMetrics?.modifiedPixels?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Embedding Strength</label>
                      <p className="text-lg font-semibold">{metadata.integrityMetrics?.embeddingStrength || 'N/A'}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Embed Positions (First 20)</label>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                      {metadata.embedPositions?.slice(0, 20).join(', ')}
                      {(metadata.embedPositions?.length || 0) > 20 && '...'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Resolution */}
              {disputeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="text-primary mr-3" />
                      Ownership Dispute Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Chronological Priority</span>
                      </div>
                      <p className="text-sm text-green-700">
                        This artwork ranks #{disputeData.chronologicalRank} in creation chronology
                        {disputeData.chronologicalRank === 1 && " - First creation detected"}
                      </p>
                    </div>

                    {disputeData.similarArtworks?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Similar Artworks (Potential Disputes)</h4>
                        <div className="space-y-2">
                          {disputeData.similarArtworks.map((artwork: any) => (
                            <div key={artwork.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                              <div>
                                <p className="font-medium text-sm">{artwork.artworkTitle}</p>
                                <p className="text-xs text-yellow-700">by {artwork.artistName}</p>
                                <p className="text-xs text-yellow-600">Created: {formatDate(artwork.creationDate)}</p>
                              </div>
                              <Badge variant="outline">{artwork.similarity}% similar</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-text-secondary">Failed to load metadata</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}