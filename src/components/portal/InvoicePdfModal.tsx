'use client';

import React, { useState } from 'react';
import { Send, X, Building2, CheckCircle, Clock, Shield, Download, FileText, Loader2, Award } from 'lucide-react';
import { Invoice, Client, CaseFile } from '../../types/portal';
import jsPDF from 'jspdf';

interface InvoicePdfModalProps {
  invoice: Invoice;
  client?: Client | null;
  caseFile?: CaseFile | null;
  onClose: () => void;
  onMarkPaid?: (invoiceId: string, paymentMethod?: any) => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  invoice,
  client,
  caseFile,
  onClose,
  onMarkPaid
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const clientPhone = client?.phone || '+92 300 8551928';
  const cleanPhone = clientPhone.replace(/[^0-9]/g, '');

  const loadImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      const logoImg = await loadImage('https://i.ibb.co/xS4KS0LC/Untitled-design-2.png');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Color Definitions (Current Website Color Palette)
      const primaryBrown = [97, 41, 18]; // #612912
      const deepBrown = [69, 36, 21]; // #452415
      const goldAccent = [229, 184, 66]; // #E5B842
      const darkText = [70, 28, 12]; // #461C0C
      const grayText = [71, 85, 105]; // #475569
      const bgLight = [250, 248, 245]; // #FAF8F5
      const borderGray = [226, 232, 240];

      let y = 15;

      // Header Logo / Banner
      if (logoImg) {
        try {
          doc.addImage(logoImg, 'PNG', 14, y + 2, 38, 12);
        } catch {
          // Fallback box
          doc.setDrawColor(0, 0, 0);
          doc.rect(14, y, 16, 16);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('RLA', 22, y + 11, { align: 'center' });
        }
      } else {
        doc.setDrawColor(0, 0, 0);
        doc.rect(14, y, 16, 16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('RLA', 22, y + 11, { align: 'center' });
      }

      // Firm Name & Subtitle
      const textX = logoImg ? 60 : 34;
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text('RAHIM LAW ASSOCIATES', textX, y + 7);

      doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
      doc.roundedRect(textX + 78, y + 2, 22, 5, 1, 1, 'F');
      doc.setTextColor(38, 16, 8);
      doc.setFontSize(7);
      doc.text('ADVOCATES', textX + 89, y + 5.5, { align: 'center' });

      doc.setTextColor(deepBrown[0], deepBrown[1], deepBrown[2]);
      doc.setFontSize(8);
      doc.text('ADVOCATES · LITIGATION · LEGAL ADVISORY', textX, y + 13);

      // Invoice Title Right Aligned
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL LEGAL INVOICE', 196, y + 6, { align: 'right' });

      doc.setFontSize(11);
      doc.text(invoice.invoiceNumber, 196, y + 12, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('FBR NTN: 4029182-7  |  STRN: 3277876123411', 196, y + 16, { align: 'right' });

      y += 20;

      // Address & Phone Line
      doc.setFontSize(8);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('Executive Suite 402, Judicial Heights, Sector F-7/2, Islamabad, Pakistan', 14, y);
      doc.text('Ph: +92 345 5061906 | Email: contact@rahimlawassociates.com', 14, y + 4);

      y += 8;

      // Divider Line
      doc.setDrawColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.setLineWidth(0.8);
      doc.line(14, y, 196, y);

      y += 6;

      // Metadata Bar
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');

      const colWidth = 182 / 4;

      // Col 1: Issue Date
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('ISSUE DATE', 14 + 4, y + 5);
      doc.setFontSize(9);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(invoice.issueDate, 14 + 4, y + 10);

      // Col 2: Due Date
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('PAYMENT DUE DATE', 14 + colWidth + 4, y + 5);
      doc.setFontSize(9);
      doc.setTextColor(180, 30, 30);
      doc.text(invoice.dueDate, 14 + colWidth + 4, y + 10);

      // Col 3: Tax Year
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('TAX YEAR', 14 + colWidth * 2 + 4, y + 5);
      doc.setFontSize(9);
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text(caseFile?.taxYear || '2026', 14 + colWidth * 2 + 4, y + 10);

      // Col 4: Status
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('PAYMENT STATUS', 14 + colWidth * 3 + 4, y + 5);
      doc.setFontSize(9);
      if (invoice.status === 'Paid') {
        doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      } else {
        doc.setTextColor(180, 100, 20);
      }
      doc.text(invoice.status.toUpperCase(), 14 + colWidth * 3 + 4, y + 10);

      y += 18;

      // Billed To & Legal Case Reference Cards
      const cardWidth = 88;
      const cardHeight = 36;

      // Left Card: Billed To
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.roundedRect(14, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('BILLED TO (CLIENT / INSTRUCTING PARTY)', 18, y + 5);

      doc.setFontSize(9.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      const clientNameText = doc.splitTextToSize(invoice.clientName, cardWidth - 8);
      doc.text(clientNameText, 18, y + 10);

      let clientY = y + 10 + clientNameText.length * 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`NTN Number: ${invoice.clientNtn || client?.ntn || '3918274-1'}`, 18, clientY);
      clientY += 4;
      doc.text(`CNIC / Reg: ${client?.cnic || '37405-1928374-1'}`, 18, clientY);
      clientY += 4;
      const addressText = doc.splitTextToSize(`Address: ${client?.registeredAddress || 'F-7 Markaz, Islamabad'}`, cardWidth - 8);
      doc.text(addressText, 18, clientY);

      // Right Card: Case Ref
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(108, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('LEGAL CASE REFERENCE', 112, y + 5);

      doc.setFontSize(9);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      const caseTitleText = doc.splitTextToSize(caseFile?.caseTitle || invoice.serviceDescription, cardWidth - 8);
      doc.text(caseTitleText, 112, y + 10);

      let caseY = y + 10 + caseTitleText.length * 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Case Ref No: ${caseFile?.caseRef || invoice.caseId}`, 112, caseY);
      caseY += 4;
      doc.text(`Legal Forum: ${caseFile?.forum || 'Islamabad High Court (IHC)'}`, 112, caseY);
      caseY += 4;
      doc.text(`Lead Counsel: ${caseFile?.assignedCounsel || 'Mr. Rahim Nawaz Khan Abbasi'}`, 112, caseY);

      y += cardHeight + 8;

      // Table Title
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('ITEMIZED LEGAL FEE STATEMENT', 14, y);

      y += 3;

      // Table Header
      doc.setFillColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.rect(14, y, 182, 7, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('#', 18, y + 5);
      doc.text('Service Description', 30, y + 5);
      doc.text('Amount (PKR)', 190, y + 5, { align: 'right' });

      y += 7;

      // Table Items
      let itemIndex = 1;

      // Row 1
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);

      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`0${itemIndex++}`, 18, y + 5);
      doc.text(invoice.serviceDescription, 30, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('Legal Retainer, Pleadings & Court Representation', 30, y + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(`Rs. ${invoice.retainerFeePkr.toLocaleString()}`, 190, y + 6, { align: 'right' });

      doc.line(14, y + 12, 196, y + 12);
      y += 12;

      // Row 2 (Hearing Fee if > 0)
      if (invoice.hearingFeePkr > 0) {
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`0${itemIndex++}`, 18, y + 5);
        doc.text('High Court & Bench Appearance Fee', 30, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text('Per appearance fee for Senior Advocate on Cause List', 30, y + 9);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.text(`Rs. ${invoice.hearingFeePkr.toLocaleString()}`, 190, y + 6, { align: 'right' });

        doc.line(14, y + 12, 196, y + 12);
        y += 12;
      }

      // Row 3 (Sales Tax if > 0)
      if (invoice.salesTaxPkr > 0) {
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`0${itemIndex++}`, 18, y + 5);
        doc.text('Provincial Services Sales Tax (ICT PST 16%)', 30, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text('Statutory Tax on Legal & Professional Consultancy Services', 30, y + 9);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.text(`Rs. ${invoice.salesTaxPkr.toLocaleString()}`, 190, y + 6, { align: 'right' });

        doc.line(14, y + 12, 196, y + 12);
        y += 12;
      }

      // Table Totals Box
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(14, y, 182, 20, 'F');
      doc.rect(14, y, 182, 20, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);

      doc.text('Subtotal Fees:', 120, y + 5);
      doc.text(`Rs. ${(invoice.retainerFeePkr + invoice.hearingFeePkr).toLocaleString()}`, 190, y + 5, { align: 'right' });

      doc.text('Sales Tax (PRA/ICT PST):', 120, y + 9);
      doc.text(`Rs. ${invoice.salesTaxPkr.toLocaleString()}`, 190, y + 9, { align: 'right' });

      doc.setLineWidth(0.4);
      doc.setDrawColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.line(120, y + 11, 192, y + 11);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('TOTAL AMOUNT PAYABLE:', 120, y + 16);
      doc.text(`Rs. ${invoice.totalAmountPkr.toLocaleString()}`, 190, y + 16, { align: 'right' });

      y += 26;

      // Bank Transfer Details & Terms
      doc.setFillColor(250, 248, 245);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.roundedRect(14, y, 88, 28, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('OFFICIAL BANK TRANSFER ACCOUNT', 18, y + 5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text('Bank: Habib Bank Limited (HBL) / Meezan Bank', 18, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.text('Title: RAHIM LAW ASSOCIATES', 18, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.text('Account No: 0102-0104829103', 18, y + 18);
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN: PK36 MEZN 0001 0201 0482 9103', 18, y + 22);

      // Terms Box
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.roundedRect(108, y, 88, 28, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('TERMS & INSTRUCTIONS', 112, y + 5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(`1. Mention Invoice Ref No. ${invoice.invoiceNumber} in remarks.`, 112, y + 10);
      doc.text('2. Cheques/Pay Orders in favor of RAHIM LAW ASSOCIATES.', 112, y + 14);
      doc.text('3. Send payment confirmation via WhatsApp or email.', 112, y + 18);

      y += 36;

      // Signatures
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('This is a computer-generated official legal fee invoice from Rahim Law Associates.', 14, y + 6);
      doc.text('No manual signature required.', 14, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryBrown[0], primaryBrown[1], primaryBrown[2]);
      doc.text('RAHIM LAW ASSOCIATES', 196, y + 2, { align: 'right' });

      doc.setLineWidth(0.5);
      doc.line(130, y + 4, 196, y + 4);

      doc.setFontSize(8);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text('Mr. Rahim Nawaz Khan Abbasi', 196, y + 8, { align: 'right' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('Senior Advocate Supreme Court & High Court', 196, y + 12, { align: 'right' });

      // Save PDF
      const cleanNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Rahim_Law_Associates_Invoice_${cleanNum}.pdf`);
    } catch (e) {
      console.error('PDF generation error, fallback to print:', e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const message = `*RAHIM LAW ASSOCIATES - ADVOCATES & LEGAL CONSULTANTS*
📍 Executive Suite 402, Judicial Heights, Sector F-7/2, Islamabad
📞 Phone: +92 345 5061906 | ✉️ Email: contact@rahimlawassociates.com

*OFFICIAL LEGAL FEE INVOICE: ${invoice.invoiceNumber}*

Dear ${invoice.clientName},

Please find your official legal fee invoice details for:
📌 *Service:* ${invoice.serviceDescription}
⚖️ *Case Ref:* ${caseFile?.caseRef || invoice.caseId}
📅 *Issue Date:* ${invoice.issueDate}
⏱️ *Payment Due Date:* ${invoice.dueDate}

💰 *ITEMIZED FEE BREAKDOWN (PKR):*
• Retainer / Case Preparation: Rs. ${invoice.retainerFeePkr.toLocaleString()}
• Hearing / Appearance Fee: Rs. ${invoice.hearingFeePkr.toLocaleString()}
• Provincial Services Sales Tax: Rs. ${invoice.salesTaxPkr.toLocaleString()}
---------------------------------
*TOTAL PAYABLE AMOUNT:* *Rs. ${invoice.totalAmountPkr.toLocaleString()}*
*PAYMENT STATUS:* *${invoice.status.toUpperCase()}*

🏦 *BANK TRANSFER DETAILS:*
• Bank: Habib Bank Limited (HBL) / Meezan Bank
• Account Title: RAHIM LAW ASSOCIATES
• Account No: 0102-0104829103
• IBAN: PK36 MEZN 0001 0201 0482 9103

Please transfer the fee amount and share payment confirmation/receipt. Reply to this message for any queries.

Thank you for choosing Rahim Law Associates!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Inject Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-pdf, #printable-invoice-pdf * {
            visibility: visible !important;
          }
          #printable-invoice-pdf {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto overflow-hidden border border-[#612912]/20 shadow-2xl flex flex-col max-h-[92vh] font-sans">
        {/* Top Control Bar - Hidden on Print */}
        <div className="no-print bg-[#612912] text-white p-4 flex items-center justify-between shrink-0 border-b border-[#452415]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E5B842]" />
            <h3 className="font-heading font-bold text-sm sm:text-base">
              Official Legal Invoice PDF — {invoice.invoiceNumber}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Send Invoice details directly to Client WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#E5B842] hover:bg-[#d9ab38] text-[#2A160E] font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Download official PDF file"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PDF</span>
                </>
              )}
            </button>

            {onMarkPaid && invoice.status !== 'Paid' && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                className="bg-[#612912]/15 hover:bg-[#612912]/25 text-[#612912] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-[#612912]/30"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#612912]" />
                <span className="hidden sm:inline">Mark Paid</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white font-bold p-1 text-lg ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable PDF Canvas Area */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white text-[#461C0C]" id="printable-invoice-pdf">
          {/* Header Letterhead with Official Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-[#612912] gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative h-14 w-44 shrink-0 bg-transparent flex items-center justify-center overflow-hidden">
                  <img
                    src="https://i.ibb.co/xS4KS0LC/Untitled-design-2.png"
                    alt="Rahim Law Associates Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-heading font-bold text-[#612912] tracking-tight">
                      RAHIM LAW ASSOCIATES
                    </h1>
                    <span className="bg-[#E5B842] text-[#2A160E] font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                      Advocates
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#452415] uppercase tracking-wider">
                    Advocates · Litigation · Legal Advisory
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-md leading-relaxed font-medium">
                Executive Suite 402, Judicial Heights, Sector F-7/2, Islamabad, Pakistan
                <br />
                Ph: <strong className="text-[#612912]">+92 345 5061906</strong> | Email: <strong className="text-[#612912]">contact@rahimlawassociates.com</strong>
              </p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-[#612912]/20 pl-3 sm:pl-0">
              <div className="inline-block bg-[#612912]/10 text-[#612912] font-bold text-xs px-3 py-1 rounded-md mb-2">
                OFFICIAL LEGAL INVOICE
              </div>
              <div className="font-mono text-base font-bold text-[#612912]">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                FBR NTN: <span className="font-mono font-bold text-slate-900">4029182-7</span>
              </div>
              <div className="text-xs text-slate-600">
                PRA / ICT STRN: <span className="font-mono font-bold text-slate-900">3277876123411</span>
              </div>
            </div>
          </div>

          {/* Key Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 bg-[#FAF8F5] rounded-2xl border border-slate-200 my-6 p-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Issue Date</span>
              <span className="font-bold text-[#461C0C]">{invoice.issueDate}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Due Date</span>
              <span className="font-bold text-red-700">{invoice.dueDate}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tax Year</span>
              <span className="font-bold text-[#612912]">{caseFile?.taxYear || '2026'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
              <span
                className={`inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-md ${
                  invoice.status === 'Paid'
                    ? 'bg-[#612912]/15 text-[#612912]'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Billed To & Case Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
            {/* Bill To */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-[#612912] block mb-2">
                Billed To (Client / Instructing Party)
              </span>
              <div className="font-bold text-sm text-[#461C0C]">{invoice.clientName}</div>
              {client?.businessName && (
                <div className="text-slate-600 font-medium">{client.businessName}</div>
              )}
              <div className="mt-2 space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold">NTN Number:</span>{' '}
                  <span className="font-mono font-bold text-[#612912]">
                    {invoice.clientNtn || client?.ntn || '3918274-1'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">CNIC / Reg No:</span>{' '}
                  <span className="font-mono">{client?.cnic || '37405-1928374-1'}</span>
                </div>
                <div>
                  <span className="font-semibold">Address:</span>{' '}
                  <span>{client?.registeredAddress || 'F-7 Markaz, Islamabad, Pakistan'}</span>
                </div>
              </div>
            </div>

            {/* Case Reference */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-[#612912] block mb-2">
                Legal Case Reference
              </span>
              <div className="font-bold text-[#461C0C]">
                {caseFile?.caseTitle || invoice.serviceDescription}
              </div>
              <div className="mt-2 space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold">Case Ref No:</span>{' '}
                  <span className="font-mono font-bold text-[#612912]">
                    {caseFile?.caseRef || invoice.caseId}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Legal Forum:</span>{' '}
                  <span>{caseFile?.forum || 'Islamabad High Court (IHC)'}</span>
                </div>
                <div>
                  <span className="font-semibold">Lead Counsel:</span>{' '}
                  <span>{caseFile?.assignedCounsel || 'Mr. Rahim Nawaz Khan Abbasi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="mb-6">
            <h4 className="font-heading font-bold text-xs text-[#612912] uppercase tracking-wider mb-2">
              Itemized Legal Fee Statement
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#612912] text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Service Description</th>
                    <th className="p-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-500">01</td>
                    <td className="p-3">
                      <div className="font-bold text-[#461C0C]">{invoice.serviceDescription}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Legal Retainer, Pleadings & Court Representation
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      Rs. {invoice.retainerFeePkr.toLocaleString()}
                    </td>
                  </tr>

                  {invoice.hearingFeePkr > 0 && (
                    <tr>
                      <td className="p-3 font-mono font-bold text-slate-500">02</td>
                      <td className="p-3">
                        <div className="font-bold text-[#461C0C]">High Court & Bench Appearance Fee</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Per appearance fee for Senior Advocate on Cause List
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        Rs. {invoice.hearingFeePkr.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {invoice.salesTaxPkr > 0 && (
                    <tr>
                      <td className="p-3 font-mono font-bold text-slate-500">03</td>
                      <td className="p-3">
                        <div className="font-bold text-[#461C0C]">Provincial Services Sales Tax (ICT PST 16%)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Statutory Tax on Legal & Professional Consultancy Services
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        Rs. {invoice.salesTaxPkr.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Summary Block */}
              <div className="bg-[#FAF8F5] border-t border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Fees:</span>
                  <span className="font-mono">
                    Rs. {(invoice.retainerFeePkr + invoice.hearingFeePkr).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax (PRA/ICT PST):</span>
                  <span className="font-mono">Rs. {invoice.salesTaxPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#612912] text-sm pt-2 border-t border-slate-300">
                  <span>TOTAL AMOUNT PAYABLE:</span>
                  <span className="font-mono text-base text-[#612912]">
                    Rs. {invoice.totalAmountPkr.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Payment Transfer Details & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
            <div className="p-4 rounded-2xl bg-[#612912]/5 border border-[#612912]/20">
              <span className="text-[10px] uppercase font-bold text-[#612912] block mb-2">
                Official Bank Transfer Account
              </span>
              <div className="space-y-1 font-mono text-slate-800">
                <div>
                  <span className="text-slate-500 font-sans font-semibold">Bank Name:</span> Habib Bank Limited (HBL) / Meezan Bank
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">Account Title:</span>{' '}
                  <span className="font-bold text-[#612912]">RAHIM LAW ASSOCIATES</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">Account No:</span> 0102-0104829103
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">IBAN:</span>{' '}
                  <span className="font-bold">PK36 MEZN 0001 0201 0482 9103</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600 block mb-2">
                Terms & Instructions
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1. Please mention Invoice Ref No. <strong className="font-mono">{invoice.invoiceNumber}</strong> in the bank transfer remarks.
                <br />
                2. Cross Cheques / Pay Orders should be issued in favor of <strong>RAHIM LAW ASSOCIATES</strong>.
                <br />
                3. Send payment confirmation receipt directly via WhatsApp or email.
              </p>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 mt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
            <div className="text-[10px] text-slate-500 italic max-w-sm">
              This is a computer-generated official legal fee invoice from Rahim Law Associates. No manual signature required.
            </div>

            <div className="text-center sm:text-right">
              <div className="font-heading font-bold text-[#612912] text-sm tracking-wide">
                RAHIM LAW ASSOCIATES
              </div>
              <div className="w-48 h-0.5 bg-[#612912] my-2 ml-auto" />
              <div className="text-[11px] font-bold text-slate-800">
                Mr. Rahim Nawaz Khan Abbasi
              </div>
              <div className="text-[10px] text-[#612912] font-bold">
                Senior Advocate Supreme Court & High Court
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar - Hidden on Print */}
        <div className="no-print bg-[#FAF8F5] border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Recipient: <strong className="text-[#612912]">{clientPhone}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#612912] hover:bg-[#452415] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E5B842]" />
                  <span>Generating PDF File...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#E5B842]" />
                  <span>Download Official PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
