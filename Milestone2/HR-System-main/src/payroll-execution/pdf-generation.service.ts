import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface PayslipItem {
    label: string;
    amount: number;
}

export interface PayslipData {
    runId: string;
    period: Date;
    employeeName: string;
    employeeId: string;
    department: string;
    bankAccount: string;
    earnings: PayslipItem[];
    deductions: PayslipItem[];
    netPay: number;
}

@Injectable()
export class PdfGenerationService {
    private readonly logger = new Logger(PdfGenerationService.name);
    private readonly uploadDir = path.join(process.cwd(), 'dist', 'uploads', 'payslips');

    constructor() {
        this.ensureUploadDirectoryExists();
    }

    private ensureUploadDirectoryExists() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async generatePayslip(data: PayslipData): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `${data.runId}_${data.employeeId}.pdf`;
                const filePath = path.join(this.uploadDir, fileName);

                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                // --- PDF LAYOUT ---

                // 1. Header
                doc.fontSize(20).text('PAYSLIP', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Company A (US)`, { align: 'center' });
                doc.text(`Payroll Period: ${data.period.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, { align: 'center' });
                doc.moveDown();
                doc.moveDown();

                // 2. Employee Details Grid
                const startY = doc.y;
                doc.fontSize(10);

                doc.text(`Employee Name: ${data.employeeName}`, 50, startY);
                doc.text(`Employee ID: ${data.employeeId}`, 300, startY);

                doc.moveDown();
                const nextY = doc.y;
                doc.text(`Department: ${data.department}`, 50, nextY);
                doc.text(`Bank Account: ${data.bankAccount || 'N/A'}`, 300, nextY);

                doc.moveDown();
                doc.moveDown();

                // 3. Earnings Section
                this.generateTable(doc, 'EARNINGS', data.earnings, 50);

                // 4. Deductions Section
                // Calculate where to start deductions (same height as earnings)
                // However, tables might have different lengths. For simplicity, we keep them separate or side-by-side if they fit.
                // Let's keep them side-by-side if they fit, or one after another.
                // Side-by-side is better for space.
                const tableY = doc.y; // Capture Y before rendering deductions if we wanted side-by-side
                // Actually generateTable moves doc.y

                doc.moveDown();
                this.generateTable(doc, 'DEDUCTIONS', data.deductions, 50, true);

                doc.moveDown();
                doc.moveDown();

                // 5. Totals
                const totalEarnings = data.earnings.reduce((a, b) => a + b.amount, 0);
                const totalDeductions = data.deductions.reduce((a, b) => a + b.amount, 0);

                doc.fontSize(12).font('Helvetica-Bold');
                doc.text(`Total Earnings: $${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 50);
                doc.text(`Total Deductions: $${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 50);

                doc.moveDown();
                doc.fontSize(14).fillColor('blue');
                doc.text(`NET PAY: $${data.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
                doc.fillColor('black');

                // Footer
                doc.fontSize(8);
                doc.text('This is a system generated payslip.', 50, 750, { align: 'center' });

                doc.end();

                stream.on('finish', () => {
                    this.logger.log(`Generated PDF: ${filePath}`);
                    resolve(`/uploads/payslips/${fileName}`);
                });

                stream.on('error', (err) => {
                    this.logger.error(`Error writing PDF: ${err.message}`);
                    reject(err);
                });

            } catch (error) {
                this.logger.error(`Failed to generate PDF: ${error.message}`);
                reject(error);
            }
        });
    }

    private generateTable(doc: typeof PDFDocument, title: string, rows: PayslipItem[], x: number, isDeduction = false) {
        doc.fontSize(12).font('Helvetica-Bold').text(title, x);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        if (rows.length === 0) {
            doc.text('None', x);
            doc.moveDown();
            return;
        }

        rows.forEach(row => {
            const currentY = doc.y;
            doc.text(row.label, x);
            doc.text(`$${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, x + 300, currentY, { align: 'right', width: 100 });
            doc.moveDown(0.2);
        });
    }
}
