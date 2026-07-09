import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportDataRow {
  date: string;
  description: string;
  category: string;
  amount: number | string;
  [key: string]: any;
}

export interface ExportStats {
  total: number;
  count: number;
  average?: number;
}

/**
 * Generates and downloads a clean, branded PDF report for transactions / analytics
 */
export const exportToPDF = (
  title: string,
  data: ExportDataRow[],
  filename: string,
  stats?: ExportStats
) => {
  const doc = new jsPDF();

  // Header styling
  doc.setFillColor(37, 99, 235); // Blue header bar (#2563EB)
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LIMITLY FINANCIAL REPORT', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), 140, 15);

  // Metadata / Stats
  doc.setTextColor(55, 65, 81); // Gray-700
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42);

  let startY = 50;

  if (stats) {
    // Summary KPI Box
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, 46, 182, 18, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`Total Spent: INR ${stats.total.toFixed(2)}`, 20, 57);
    doc.text(`Transactions Count: ${stats.count}`, 90, 57);
    if (stats.average !== undefined) {
      doc.text(`Average: INR ${stats.average.toFixed(2)}`, 145, 57);
    }
    startY = 72;
  }

  // Prepare table data
  const tableHeaders = [['Date', 'Description / Item', 'Category', 'Amount (INR)']];
  const tableRows = data.map((item) => [
    item.date || 'N/A',
    item.description || item.name || 'Expense',
    item.category || item.categoryName || 'General',
    `INR ${Number(item.amount || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' } // Right align amount
    },
    margin: { top: 20, left: 14, right: 14, bottom: 20 }
  });

  doc.save(`${filename}.pdf`);
};

/**
 * Generates and downloads a clean Excel (.xlsx) workbook for transactions / analytics
 */
export const exportToExcel = (
  title: string,
  data: ExportDataRow[],
  filename: string,
  stats?: ExportStats
) => {
  // Format rows for Excel
  const formattedRows: any[] = data.map((item) => ({
    Date: item.date || 'N/A',
    Description: item.description || item.name || 'Expense',
    Category: item.category || item.categoryName || 'General',
    'Amount (INR)': Number(item.amount || 0)
  }));

  // Add blank separation row & Total row if stats exist
  if (stats) {
    formattedRows.push({
      Date: '',
      Description: '',
      Category: '',
      'Amount (INR)': ''
    });
    formattedRows.push({
      Date: 'TOTAL SPENT',
      Description: `${stats.count} Transactions`,
      Category: stats.average ? `Avg: INR ${stats.average.toFixed(2)}` : '',
      'Amount (INR)': stats.total
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Date
    { wch: 35 }, // Description
    { wch: 20 }, // Category
    { wch: 18 }  // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 30));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
