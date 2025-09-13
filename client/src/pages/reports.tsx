import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthenticationTrends } from "@/components/charts/authentication-trends";
import { AttackResistance } from "@/components/charts/attack-resistance";
import { AttackDistribution } from "@/components/charts/attack-distribution";
import { FileText, BarChart, Download, FileSpreadsheet, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Reports() {
  const { toast } = useToast();
  const [reportConfig, setReportConfig] = useState({
    reportType: "Attack Simulation Summary",
    startDate: "",
    endDate: "",
    includedSections: ["Attack Resistance Analysis", "Verification Statistics"]
  });

  // Fetch recent reports
  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { reportType: string; dateRange: any; includedSections: string[]; fileFormat: string }) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Report generation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const handleSectionToggle = (section: string) => {
    setReportConfig(prev => ({
      ...prev,
      includedSections: prev.includedSections.includes(section)
        ? prev.includedSections.filter(s => s !== section)
        : [...prev.includedSections, section]
    }));
  };

  const handleGenerateReport = (fileFormat: string) => {
    const dateRange = reportConfig.startDate && reportConfig.endDate 
      ? { start: new Date(reportConfig.startDate), end: new Date(reportConfig.endDate) }
      : null;

    generateReportMutation.mutate({
      reportType: reportConfig.reportType,
      dateRange,
      includedSections: reportConfig.includedSections,
      fileFormat
    });
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      window.open(`/api/reports/download/${reportId}`, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-text-secondary">Generate comprehensive security reports and view platform analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Analytics Dashboard */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center">
              <BarChart className="text-primary mr-3" />
              Security Analytics
            </CardTitle>
            <p className="text-text-secondary">Performance metrics and security insights</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Authentication Trend Chart */}
            <div className="mb-6">
              <AuthenticationTrends />
            </div>

            {/* Attack Resistance Analysis */}
            <div className="mb-6">
              <AttackResistance />
            </div>

            {/* Attack Distribution */}
            <AttackDistribution />
          </CardContent>
        </Card>

        {/* Report Generation */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center">
              <FileText className="text-secondary mr-3" />
              Report Generation
            </CardTitle>
            <p className="text-text-secondary">Generate and download detailed security reports</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Report Types */}
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={reportConfig.reportType} 
                  onValueChange={(value) => setReportConfig({ ...reportConfig, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attack Simulation Summary">Attack Simulation Summary</SelectItem>
                    <SelectItem value="Authentication Audit">Authentication Audit</SelectItem>
                    <SelectItem value="Security Compliance Report">Security Compliance Report</SelectItem>
                    <SelectItem value="Performance Analytics">Performance Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportConfig.startDate}
                    onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportConfig.endDate}
                    onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Include Sections</Label>
                <div className="space-y-2">
                  {["Attack Resistance Analysis", "Verification Statistics", "Detailed Image Analysis", "Security Recommendations"].map((section) => (
                    <label key={section} className="flex items-center">
                      <Checkbox
                        checked={reportConfig.includedSections.includes(section)}
                        onCheckedChange={() => handleSectionToggle(section)}
                        className="mr-2"
                      />
                      <span className="text-sm">{section}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => handleGenerateReport('excel')}
                  disabled={generateReportMutation.isPending}
                  className="w-full bg-secondary text-white hover:bg-secondary/90"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {generateReportMutation.isPending ? "Generating..." : "Generate Excel Report"}
                </Button>
                <Button
                  onClick={() => handleGenerateReport('pdf')}
                  disabled={generateReportMutation.isPending}
                  className="w-full bg-error text-white hover:bg-red-700"
                >
                  <FileType className="w-4 h-4 mr-2" />
                  {generateReportMutation.isPending ? "Generating..." : "Generate PDF Report"}
                </Button>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Recent Reports</h3>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : recentReports && recentReports.length > 0 ? (
                <div className="space-y-2">
                  {recentReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FileSpreadsheet className="text-secondary mr-3 w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">{report.reportName}.{report.fileFormat}</p>
                          <p className="text-xs text-text-secondary">Generated {formatDate(report.generationDate)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReport(report.id)}
                        className="text-primary hover:text-primary/90"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-text-secondary py-4">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No reports generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Insights */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Types Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Attack Simulation Summary
            </h3>
            <p className="text-text-secondary">Comprehensive analysis of attack resistance testing including PSNR values, integrity scores, and success rates across different attack vectors.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
              Authentication Audit
            </h3>
            <p className="text-text-secondary">Detailed audit trail of all image authentication events, verification attempts, and system integrity checks with timestamps and metadata.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
              Security Compliance
            </h3>
            <p className="text-text-secondary">Compliance reporting for security standards, encryption protocols, and steganographic implementation best practices verification.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <div className="w-2 h-2 bg-error rounded-full mr-2"></div>
              Performance Analytics
            </h3>
            <p className="text-text-secondary">System performance metrics including processing times, throughput analysis, database growth, and resource utilization statistics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
