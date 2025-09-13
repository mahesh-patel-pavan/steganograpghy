import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { storage } from '../storage';

interface ReportConfig {
  reportType: string;
  dateRange?: { start: Date; end: Date };
  includedSections: string[];
}

class ReportGenerationService {
  
  async generateReport(config: ReportConfig): Promise<any> {
    try {
      const data: any = {};
      
      if (config.includedSections.includes('Attack Resistance Analysis')) {
        data.attackResistance = await this.generateAttackResistanceData(config.dateRange);
      }
      
      if (config.includedSections.includes('Verification Statistics')) {
        data.verificationStats = await this.generateVerificationStats(config.dateRange);
      }
      
      if (config.includedSections.includes('Detailed Image Analysis')) {
        data.imageAnalysis = await this.generateImageAnalysis(config.dateRange);
      }
      
      if (config.includedSections.includes('Security Recommendations')) {
        data.securityRecommendations = await this.generateSecurityRecommendations();
      }
      
      return data;
    } catch (error) {
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateExcelFile(report: any): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const reportData = report.reportData;
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    // Add summary data
    summarySheet.addRow({ metric: 'Report Type', value: report.reportType });
    summarySheet.addRow({ metric: 'Generation Date', value: report.generationDate });
    summarySheet.addRow({ metric: 'Date Range', value: this.formatDateRange(report.dateRange) });
    
    // Attack Resistance Analysis sheet
    if (reportData.attackResistance) {
      const attackSheet = workbook.addWorksheet('Attack Resistance');
      attackSheet.columns = [
        { header: 'Attack Type', key: 'attackType', width: 20 },
        { header: 'Total Simulations', key: 'total', width: 15 },
        { header: 'Successful Attacks', key: 'successful', width: 15 },
        { header: 'Resistance Rate (%)', key: 'resistanceRate', width: 15 },
        { header: 'Avg PSNR', key: 'avgPsnr', width: 12 },
        { header: 'Avg Integrity Loss (%)', key: 'avgIntegrityLoss', width: 18 }
      ];
      
      reportData.attackResistance.forEach((row: any) => {
        attackSheet.addRow(row);
      });
    }
    
    // Verification Statistics sheet
    if (reportData.verificationStats) {
      const verificationSheet = workbook.addWorksheet('Verification Stats');
      verificationSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Total Verifications', key: 'total', width: 15 },
        { header: 'Successful', key: 'successful', width: 12 },
        { header: 'Failed', key: 'failed', width: 12 },
        { header: 'Success Rate (%)', key: 'successRate', width: 15 }
      ];
      
      reportData.verificationStats.forEach((row: any) => {
        verificationSheet.addRow(row);
      });
    }
    
    // Style the workbook
    this.styleWorkbook(workbook);
    
    // Save file
    const fileName = `${report.reportName}.xlsx`;
    const filePath = path.join(process.cwd(), 'reports', fileName);
    
    // Ensure reports directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    // Update report with file path
    await storage.updateReportFilePath(report.id, filePath);
    
    return filePath;
  }

  private async generateAttackResistanceData(dateRange?: { start: Date; end: Date }) {
    const simulations = await storage.getAttackSimulationsInRange(dateRange);
    
    const attackTypes = ['jpeg_compression', 'gaussian_noise', 'cropping', 'rotation', 'scaling'];
    const results = [];
    
    for (const attackType of attackTypes) {
      const typeSimulations = simulations.filter(s => s.attackType === attackType);
      const total = typeSimulations.length;
      const successful = typeSimulations.filter(s => !s.verificationPassed).length;
      const resistanceRate = total > 0 ? ((total - successful) / total) * 100 : 0;
      const avgPsnr = total > 0 ? typeSimulations.reduce((sum, s) => sum + (s.psnr || 0), 0) / total : 0;
      const avgIntegrityLoss = total > 0 ? typeSimulations.reduce((sum, s) => sum + (s.integrityLoss || 0), 0) / total : 0;
      
      results.push({
        attackType: this.formatAttackTypeName(attackType),
        total,
        successful,
        resistanceRate: Math.round(resistanceRate * 100) / 100,
        avgPsnr: Math.round(avgPsnr * 100) / 100,
        avgIntegrityLoss: Math.round(avgIntegrityLoss * 100) / 100
      });
    }
    
    return results;
  }

  private async generateVerificationStats(dateRange?: { start: Date; end: Date }) {
    const verifications = await storage.getVerificationLogsInRange(dateRange);
    
    // Group by date
    const dailyStats = new Map();
    
    verifications.forEach(v => {
      const date = v.verificationDate.toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { total: 0, successful: 0, failed: 0 });
      }
      
      const stats = dailyStats.get(date);
      stats.total++;
      if (v.verificationResult) {
        stats.successful++;
      } else {
        stats.failed++;
      }
    });
    
    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 10000) / 100 : 0
    }));
  }

  private async generateImageAnalysis(dateRange?: { start: Date; end: Date }) {
    const images = await storage.getAuthenticatedImagesInRange(dateRange);
    
    return images.map(img => ({
      id: img.id,
      artistName: img.artistName,
      artworkTitle: img.artworkTitle,
      signatureType: img.signatureType,
      verificationStatus: img.verificationStatus,
      authenticationDate: img.authenticationDate,
      fileSize: img.fileSize,
      imageFormat: img.imageFormat
    }));
  }

  private async generateSecurityRecommendations() {
    // Generate security recommendations based on current data
    const stats = await storage.getDashboardStats();
    const recommendations = [];
    
    if (stats.verificationSuccessRate < 95) {
      recommendations.push({
        priority: 'High',
        category: 'Verification',
        issue: 'Low verification success rate',
        recommendation: 'Review signature embedding parameters and consider stronger algorithms',
        impact: 'Improved authentication reliability'
      });
    }
    
    if (stats.averageAttackResistance < 75) {
      recommendations.push({
        priority: 'Medium',
        category: 'Security',
        issue: 'Low attack resistance',
        recommendation: 'Implement redundant embedding or error correction codes',
        impact: 'Better resistance to image modifications'
      });
    }
    
    recommendations.push({
      priority: 'Low',
      category: 'Performance',
      issue: 'Database optimization',
      recommendation: 'Consider archiving old verification logs and implementing data indexing',
      impact: 'Improved query performance'
    });
    
    return recommendations;
  }

  private styleWorkbook(workbook: ExcelJS.Workbook) {
    workbook.eachSheet(worksheet => {
      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      
      // Add borders
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    });
  }

  private formatAttackTypeName(attackType: string): string {
    return attackType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatDateRange(dateRange: any): string {
    if (!dateRange) return 'All time';
    return `${dateRange.start} to ${dateRange.end}`;
  }
}

export const reportGenerationService = new ReportGenerationService();
