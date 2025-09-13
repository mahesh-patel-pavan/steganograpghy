import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, AlertTriangle } from "lucide-react";
import { ImageDisplay } from "@/components/ui/image-display";

interface LedgerTableProps {
  data: any;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function LedgerTable({ data, currentPage, onPageChange }: LedgerTableProps) {
  const items = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (item: any) => {
    // All authenticated images in the ledger are verified by default
    return <Badge className="bg-secondary text-white">AUTHENTICATED</Badge>;
  };

  const handleDownload = async (imageId: number, filename: string) => {
    try {
      // Download the authenticated image with embedded steganographic signature
      const response = await fetch(`/api/download/image/${imageId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `authenticated_${filename}_${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Auth Date</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-text-secondary">
                  No authenticated images found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <ImageDisplay 
                      imageData={item.imageData}
                      alt={item.artworkTitle}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.artistName}</TableCell>
                  <TableCell>{item.artworkTitle}</TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {formatDate(item.authenticationDate)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {item.signatureType}:{item.signatureHash.substring(0, 4)}...
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent/90"
                        onClick={() => handleDownload(item.id, item.originalFilename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {item.verificationStatus === 'compromised' && (
                        <Button variant="ghost" size="sm" className="text-error hover:text-error/90">
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {Math.min((currentPage - 1) * 10 + 1, data?.total || 0)}-{Math.min(currentPage * 10, data?.total || 0)} of {data?.total || 0} authenticated images
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={pageNum === currentPage ? "bg-primary text-white" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
