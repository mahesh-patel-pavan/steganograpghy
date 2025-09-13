import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LedgerTable } from "@/components/ledger-table";
import { List, Search, Download } from "lucide-react";

export default function Ledger() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ["/api/ledger", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search || ""
      });
      const response = await fetch(`/api/ledger?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ledger data');
      }
      return response.json();
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'public_ledger_export',
          dateRange: null,
          includedSections: ['Detailed Image Analysis'],
          fileFormat: 'excel'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        window.open(result.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Public Authentication Ledger</h1>
        <p className="text-text-secondary">Transparent record of all authenticated images and their verification status</p>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <List className="text-primary mr-3" />
              Authentication Records
            </CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by artist, title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={handleExport} className="bg-primary text-white hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <LedgerTable 
              data={ledgerData} 
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Public Ledger</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-secondary">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Transparency</h3>
            <p>This public ledger provides transparent access to all authenticated images in our system, similar to blockchain technology but specifically designed for digital art authentication.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Verification</h3>
            <p>Each entry contains cryptographic proof of authenticity that can be independently verified using the embedded signatures and public keys.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Immutability</h3>
            <p>Once an image is authenticated and added to the ledger, its record becomes part of an immutable database that preserves the chain of authenticity.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Security</h3>
            <p>Our steganographic approach embeds authentication data directly into the image, making it resistant to metadata removal and ensuring persistent verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
