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

      // Page Geometry (A4: 210mm x 297mm)
      const marginLeft = 14;
      const marginRight = 196;
      const contentWidth = marginRight - marginLeft; // 182mm
      const pageBottomSafeY = 280;

      // Color Definitions (Current Website Color Palette)
      const primaryBrown: [number, number, number] = [97, 41, 18]; // #612912
      const deepBrown: [number, number, number] = [69, 36, 21]; // #452415
      const goldAccent: [number, number, number] = [229, 184, 66]; // #E5B842
      const darkText: [number, number, number] = [70, 28, 12]; // #461C0C
      const grayText: [number, number, number] = [71, 85, 105]; // #475569
      const bgLight: [number, number, number] = [250, 248, 245]; // #FAF8F5
      const borderGray: [number, number, number] = [226, 232, 240];

      let y = 14;

      const ensureSpace = (neededMm: number) => {
        if (y + neededMm > pageBottomSafeY) {
          doc.addPage();
          y = 16;
        }
      };

      // --- 1. PROPORTIONAL LOGO & COLLISION-FREE HEADER ---
      let logoW = 16;
      let logoH = 16;

      if (logoImg) {
        try {
          const naturalW = logoImg.naturalWidth || logoImg.width || 1;
          const naturalH = logoImg.naturalHeight || logoImg.height || 1;
          const aspectRatio = naturalW / naturalH;

          const maxLogoW = 32;
          const maxLogoH = 16;
          logoW = maxLogoW;
          logoH = logoW / aspectRatio;
          if (logoH > maxLogoH) {
            logoH = maxLogoH;
            logoW = logoH * aspectRatio;
          }

          doc.addImage(logoImg, 'PNG', marginLeft, y, logoW, logoH);
        } catch {
          doc.setDrawColor(...primaryBrown);
          doc.rect(marginLeft, y, 16, 16);
          doc.setTextColor(...primaryBrown);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('RLA', marginLeft + 8, y + 10, { align: 'center' });
        }
      } else {
        doc.setDrawColor(...primaryBrown);
        doc.rect(marginLeft, y, 16, 16);
        doc.setTextColor(...primaryBrown);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('RLA', marginLeft + 8, y + 10, { align: 'center' });
      }

      // Right Header Block (Invoice Title + Number) - Bounded strictly on right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      const rightTitleText = 'OFFICIAL LEGAL INVOICE';
      const rightTitleW = doc.getTextWidth(rightTitleText);
      doc.setFontSize(10);
      const rightInvNumW = doc.getTextWidth(invoice.invoiceNumber);
      const rightColWidth = Math.max(rightTitleW, rightInvNumW, 48);
      const rightColBoundary = marginRight - rightColWidth - 5; // Safe left gutter before right column

      doc.setTextColor(...primaryBrown);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text(rightTitleText, marginRight, y + 5.5, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.text(invoice.invoiceNumber, marginRight, y + 11.5, { align: 'right' });

      // Left Header Text (Firm Name + Badge + Tagline) - Bounded strictly before rightColBoundary
      const textX = marginLeft + logoW + 4.5;
      const maxLeftTextW = Math.max(55, rightColBoundary - textX);

      let firmTitleFontSize = 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(firmTitleFontSize);
      while (firmTitleFontSize > 10 && doc.getTextWidth('RAHIM LAW ASSOCIATES') > maxLeftTextW) {
        firmTitleFontSize -= 0.5;
        doc.setFontSize(firmTitleFontSize);
      }

      doc.setTextColor(...primaryBrown);
      doc.text('RAHIM LAW ASSOCIATES', textX, y + 5.5);

      const firmTitleActualW = doc.getTextWidth('RAHIM LAW ASSOCIATES');
      const badgeW = 19;
      const badgeH = 4.5;
      const badgeX = textX + firmTitleActualW + 2.5;
      let leftTextBottomY = y + 7;

      // Render ADVOCATES pill inline ONLY if it does not collide with right column
      if (badgeX + badgeW <= rightColBoundary) {
        doc.setFillColor(...goldAccent);
        doc.roundedRect(badgeX, y + 1.8, badgeW, badgeH, 1, 1, 'F');
        doc.setTextColor(38, 16, 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.2);
        doc.text('ADVOCATES', badgeX + badgeW / 2, y + 4.9, { align: 'center' });
      }

      doc.setTextColor(...deepBrown);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const taglineLines = doc.splitTextToSize('ADVOCATES · LITIGATION · LEGAL ADVISORY', maxLeftTextW);
      doc.text(taglineLines, textX, y + 10.5);
      leftTextBottomY = y + 10.5 + taglineLines.length * 3.5;

      const headerBlockBottomY = Math.max(y + logoH, leftTextBottomY, y + 14);
      y = headerBlockBottomY + 4;

      // Address & Contact Row (Wrapped across full contentWidth)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      const officeAddressLines = doc.splitTextToSize(
        'Office No 13-14, 1st Floor, Shahnawaz Plaza G-11 Markaz Islamabad',
        contentWidth
      );
      doc.text(officeAddressLines, marginLeft, y);
      y += officeAddressLines.length * 3.8;

      const contactLines = doc.splitTextToSize(
        'Ph: +92 345 5061906  |  Email: rahim.nawaz@rahimlaw.pk',
        contentWidth
      );
      doc.text(contactLines, marginLeft, y);
      y += contactLines.length * 3.8 + 2;

      // Divider Line
      doc.setDrawColor(...primaryBrown);
      doc.setLineWidth(0.75);
      doc.line(marginLeft, y, marginRight, y);

      y += 5;

      // --- 2. RESPONSIVE METADATA BAR ---
      const colWidth = contentWidth / 4;
      const metaCols = [
        { label: 'ISSUE DATE', value: invoice.issueDate, color: darkText },
        { label: 'PAYMENT DUE DATE', value: invoice.dueDate, color: [180, 30, 30] as [number, number, number] },
        { label: 'TAX YEAR', value: caseFile?.taxYear || '2026', color: primaryBrown },
        {
          label: 'PAYMENT STATUS',
          value: invoice.status.toUpperCase(),
          color: invoice.status === 'Paid' ? primaryBrown : ([180, 100, 20] as [number, number, number])
        }
      ];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const wrappedMetaValues = metaCols.map((col) =>
        doc.splitTextToSize(col.value || '-', colWidth - 6)
      );
      const maxMetaLines = Math.max(...wrappedMetaValues.map((lines) => lines.length), 1);
      const metaBarHeight = Math.max(14, 8.5 + maxMetaLines * 3.8);

      doc.setFillColor(...bgLight);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, y, contentWidth, metaBarHeight, 2, 2, 'FD');

      metaCols.forEach((col, idx) => {
        const colX = marginLeft + colWidth * idx + 3.5;
        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...grayText);
        doc.text(col.label, colX, y + 4.8);

        doc.setFontSize(8.5);
        doc.setTextColor(...col.color);
        doc.text(wrappedMetaValues[idx], colX, y + 9.5);
      });

      y += metaBarHeight + 6;

      // --- 3. RESPONSIVE BILLED TO & CASE REFERENCE CARDS ---
      const cardGap = 6;
      const cardWidth = (contentWidth - cardGap) / 2; // 88mm each
      const cardInnerW = cardWidth - 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const clientNameLines = doc.splitTextToSize(invoice.clientName || 'Valued Client', cardInnerW);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const clientCnicLines = doc.splitTextToSize(`CNIC / Reg: ${client?.cnic || 'On Record'}`, cardInnerW);
      const clientAddrLines = doc.splitTextToSize(
        `Address: ${client?.registeredAddress || 'Islamabad, Pakistan'}`,
        cardInnerW
      );

      const leftCardNeededH =
        10 +
        clientNameLines.length * 4 +
        1.5 +
        clientCnicLines.length * 3.7 +
        1 +
        clientAddrLines.length * 3.7 +
        4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const caseTitleLines = doc.splitTextToSize(
        caseFile?.caseTitle || invoice.serviceDescription,
        cardInnerW
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const caseRefLines = doc.splitTextToSize(`Case Ref No: ${caseFile?.caseRef || invoice.caseId}`, cardInnerW);
      const caseForumLines = doc.splitTextToSize(
        `Legal Forum: ${caseFile?.forum || 'Islamabad High Court (IHC)'}`,
        cardInnerW
      );
      const caseCounselLines = doc.splitTextToSize(
        `Lead Counsel: ${caseFile?.assignedCounsel || 'Mr. Rahim Nawaz Khan Abbasi'}`,
        cardInnerW
      );

      const rightCardNeededH =
        10 +
        caseTitleLines.length * 4 +
        1.5 +
        caseRefLines.length * 3.7 +
        1 +
        caseForumLines.length * 3.7 +
        1 +
        caseCounselLines.length * 3.7 +
        4;

      const cardHeight = Math.max(leftCardNeededH, rightCardNeededH, 38);
      ensureSpace(cardHeight + 10);

      // Left Card Box
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(marginLeft, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBrown);
      doc.text('BILLED TO (CLIENT / INSTRUCTING PARTY)', marginLeft + 4, y + 5.2);

      let leftY = y + 10;
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.text(clientNameLines, marginLeft + 4, leftY);
      leftY += clientNameLines.length * 4 + 1.5;

      doc.setFontSize(7.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text(clientCnicLines, marginLeft + 4, leftY);
      leftY += clientCnicLines.length * 3.7 + 1;
      doc.text(clientAddrLines, marginLeft + 4, leftY);

      // Right Card Box
      const rightCardX = marginLeft + cardWidth + cardGap;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBrown);
      doc.text('LEGAL CASE REFERENCE', rightCardX + 4, y + 5.2);

      let rightY = y + 10;
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.text(caseTitleLines, rightCardX + 4, rightY);
      rightY += caseTitleLines.length * 4 + 1.5;

      doc.setFontSize(7.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text(caseRefLines, rightCardX + 4, rightY);
      rightY += caseRefLines.length * 3.7 + 1;
      doc.text(caseForumLines, rightCardX + 4, rightY);
      rightY += caseForumLines.length * 3.7 + 1;
      doc.text(caseCounselLines, rightCardX + 4, rightY);

      y += cardHeight + 7;

      // --- 4. ITEMIZED FEE TABLE (WRAPPED DESCRIPTIONS) ---
      ensureSpace(35);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBrown);
      doc.text('ITEMIZED LEGAL FEE STATEMENT', marginLeft, y);

      y += 3;

      // Table Header
      doc.setFillColor(...primaryBrown);
      doc.rect(marginLeft, y, contentWidth, 7.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('#', marginLeft + 4, y + 5.2);
      doc.text('Service Description', marginLeft + 16, y + 5.2);
      doc.text('Amount (PKR)', marginRight - 4, y + 5.2, { align: 'right' });

      y += 7.5;

      const drawFeeRow = (
        indexNum: number,
        title: string,
        subtitle: string,
        amountPkr: number
      ) => {
        const descColX = marginLeft + 16;
        const maxDescW = 116; // Stops safely at ~146mm, leaving ~46mm for right-aligned amounts
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const titleLines = doc.splitTextToSize(title, maxDescW);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const subLines = doc.splitTextToSize(subtitle, maxDescW);

        const rowH = Math.max(13, 5 + titleLines.length * 3.8 + subLines.length * 3.4 + 3);
        ensureSpace(rowH + 4);

        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.2);

        doc.setTextColor(...darkText);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`0${indexNum}`, marginLeft + 4, y + 5.2);
        doc.text(titleLines, descColX, y + 5.2);

        const subY = y + 5.2 + titleLines.length * 3.8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...grayText);
        doc.text(subLines, descColX, subY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...darkText);
        doc.text(`Rs. ${amountPkr.toLocaleString()}`, marginRight - 4, y + 5.5, { align: 'right' });

        doc.line(marginLeft, y + rowH, marginRight, y + rowH);
        y += rowH;
      };

      let itemIndex = 1;
      drawFeeRow(
        itemIndex++,
        invoice.serviceDescription,
        'Legal Retainer, Pleadings & Court Representation',
        invoice.retainerFeePkr
      );

      if (invoice.hearingFeePkr > 0) {
        drawFeeRow(
          itemIndex++,
          'High Court & Bench Appearance Fee',
          'Per appearance fee for Senior Advocate on Cause List',
          invoice.hearingFeePkr
        );
      }

      // Table Totals Box
      const netFeePayable = invoice.retainerFeePkr + invoice.hearingFeePkr;
      ensureSpace(22);
      doc.setFillColor(...bgLight);
      doc.setDrawColor(...borderGray);
      doc.rect(marginLeft, y, contentWidth, 16, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text('Subtotal Legal Fees:', 120, y + 5.2);
      doc.text(`Rs. ${netFeePayable.toLocaleString()}`, marginRight - 4, y + 5.2, { align: 'right' });

      doc.setLineWidth(0.4);
      doc.setDrawColor(...primaryBrown);
      doc.line(120, y + 8.2, marginRight - 4, y + 8.2);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBrown);
      doc.text('TOTAL AMOUNT PAYABLE:', 120, y + 13);
      doc.text(`Rs. ${netFeePayable.toLocaleString()}`, marginRight - 4, y + 13, { align: 'right' });

      y += 22;

      // --- 5. BANK TRANSFER DETAILS & TERMS CARDS (DYNAMIC EQUAL HEIGHT) ---
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const bankLines = [
        ...doc.splitTextToSize('Bank: Bank Al-Habib Limited', cardInnerW),
        ...doc.splitTextToSize('Branch: G-11 Markaz Branch Islamabad', cardInnerW)
      ];
      doc.setFont('helvetica', 'bold');
      const bankBoldLines = [
        ...doc.splitTextToSize('Title: Rahim Law Associates', cardInnerW),
        ...doc.splitTextToSize('IBAN: PK67BAHL0321098101053501', cardInnerW)
      ];
      const bankNeededH = 10 + (bankLines.length + bankBoldLines.length) * 4 + 3;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const term1 = doc.splitTextToSize(`1. Mention Invoice Ref No. ${invoice.invoiceNumber} in remarks.`, cardInnerW);
      const term2 = doc.splitTextToSize('2. Cheques/Pay Orders in favor of Rahim Law Associates.', cardInnerW);
      const term3 = doc.splitTextToSize('3. Send payment confirmation via WhatsApp or email.', cardInnerW);
      const termsNeededH = 10 + (term1.length + term2.length + term3.length) * 3.7 + 4;

      const bottomCardH = Math.max(bankNeededH, termsNeededH, 30);
      ensureSpace(bottomCardH + 26);

      // Bank Transfer Card
      doc.setFillColor(250, 248, 245);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(marginLeft, y, cardWidth, bottomCardH, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBrown);
      doc.text('OFFICIAL BANK TRANSFER ACCOUNT', marginLeft + 4, y + 5.2);

      let bankY = y + 10;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.text(bankLines, marginLeft + 4, bankY);
      bankY += bankLines.length * 4;
      doc.setFont('helvetica', 'bold');
      doc.text(bankBoldLines, marginLeft + 4, bankY);

      // Terms Card
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(rightCardX, y, cardWidth, bottomCardH, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...grayText);
      doc.text('TERMS & INSTRUCTIONS', rightCardX + 4, y + 5.2);

      let termsY = y + 10;
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.text(term1, rightCardX + 4, termsY);
      termsY += term1.length * 3.7 + 0.8;
      doc.text(term2, rightCardX + 4, termsY);
      termsY += term2.length * 3.7 + 0.8;
      doc.text(term3, rightCardX + 4, termsY);

      y += bottomCardH + 10;

      // --- 6. FOOTER & SIGNATURE BLOCK ---
      ensureSpace(20);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      const footerNoteLines = doc.splitTextToSize(
        'This is a computer-generated official legal fee invoice from Rahim Law Associates. No manual signature required.',
        108
      );
      doc.text(footerNoteLines, marginLeft, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...primaryBrown);
      doc.text('RAHIM LAW ASSOCIATES', marginRight, y + 2, { align: 'right' });

      doc.setLineWidth(0.5);
      doc.setDrawColor(...primaryBrown);
      doc.line(132, y + 4, marginRight, y + 4);

      doc.setFontSize(8);
      doc.setTextColor(...darkText);
      doc.text('Mr. Rahim Nawaz Khan Abbasi', marginRight, y + 8, { align: 'right' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text('Senior Advocate Supreme Court & High Court', marginRight, y + 12, { align: 'right' });

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
    const netTotalPayable = invoice.retainerFeePkr + invoice.hearingFeePkr;
    const message = `*RAHIM LAW ASSOCIATES - ADVOCATES & LEGAL CONSULTANTS*
📍 Office No 13-14, 1st Floor, Shahnawaz Plaza G-11 Markaz Islamabad
📞 Phone: +92 345 5061906 | ✉️ Email: rahim.nawaz@rahimlaw.pk

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
---------------------------------
*TOTAL PAYABLE AMOUNT:* *Rs. ${netTotalPayable.toLocaleString()}*
*PAYMENT STATUS:* *${invoice.status.toUpperCase()}*

🏦 *BANK TRANSFER DETAILS:*
• Bank: Bank Al-Habib Limited, G-11 Markaz Branch Islamabad
• Account Title: Rahim Law Associates
• IBAN: PK67BAHL0321098101053501

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
        <div className="p-4 sm:p-8 overflow-y-auto overflow-x-hidden bg-white text-[#461C0C]" id="printable-invoice-pdf">
          {/* Header Letterhead with Official Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-5 border-b-2 border-[#612912] gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="relative h-14 max-w-[140px] shrink-0 bg-transparent flex items-center justify-start overflow-hidden">
                  <img
                    src="https://i.ibb.co/xS4KS0LC/Untitled-design-2.png"
                    alt="Rahim Law Associates Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-heading font-bold text-[#612912] tracking-tight break-words">
                      RAHIM LAW ASSOCIATES
                    </h1>
                    <span className="bg-[#E5B842] text-[#2A160E] font-bold text-[10px] px-2 py-0.5 rounded uppercase shrink-0">
                      Advocates
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#452415] uppercase tracking-wider mt-0.5">
                    Advocates · Litigation · Legal Advisory
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-md leading-relaxed font-medium break-words">
                Office No 13-14, 1st Floor, Shahnawaz Plaza G-11 Markaz Islamabad
                <br />
                Ph: <strong className="text-[#612912]">+92 345 5061906</strong> | Email: <strong className="text-[#612912]">rahim.nawaz@rahimlaw.pk</strong>
              </p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 border-[#612912]/20 pl-3 sm:pl-0 shrink-0">
              <div className="inline-block bg-[#612912]/10 text-[#612912] font-bold text-xs px-3 py-1 rounded-md mb-2">
                OFFICIAL LEGAL INVOICE
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-[#612912]">
                {invoice.invoiceNumber}
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
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 min-w-0 break-words">
              <span className="text-[10px] uppercase font-bold text-[#612912] block mb-2">
                Billed To (Client / Instructing Party)
              </span>
              <div className="font-bold text-sm text-[#461C0C]">{invoice.clientName}</div>
              {client?.businessName && (
                <div className="text-slate-600 font-medium">{client.businessName}</div>
              )}
              <div className="mt-2 space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold">CNIC / Reg No:</span>{' '}
                  <span className="font-mono">{client?.cnic || '37405-1928374-1'}</span>
                </div>
                <div>
                  <span className="font-semibold">Address:</span>{' '}
                  <span>{client?.registeredAddress || 'Islamabad, Pakistan'}</span>
                </div>
              </div>
            </div>

            {/* Case Reference */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 min-w-0 break-words">
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
              <table className="w-full text-xs text-left table-fixed">
                <thead className="bg-[#612912] text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Service Description</th>
                    <th className="p-3 w-28 sm:w-36 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-500 align-top">01</td>
                    <td className="p-3 break-words">
                      <div className="font-bold text-[#461C0C]">{invoice.serviceDescription}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Legal Retainer, Pleadings & Court Representation
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 align-top whitespace-nowrap">
                      Rs. {invoice.retainerFeePkr.toLocaleString()}
                    </td>
                  </tr>

                  {invoice.hearingFeePkr > 0 && (
                    <tr>
                      <td className="p-3 font-mono font-bold text-slate-500 align-top">02</td>
                      <td className="p-3 break-words">
                        <div className="font-bold text-[#461C0C]">High Court & Bench Appearance Fee</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Per appearance fee for Senior Advocate on Cause List
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 align-top whitespace-nowrap">
                        Rs. {invoice.hearingFeePkr.toLocaleString()}
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
                <div className="flex justify-between font-bold text-[#612912] text-sm pt-2 border-t border-slate-300">
                  <span>TOTAL AMOUNT PAYABLE:</span>
                  <span className="font-mono text-base text-[#612912]">
                    Rs. {(invoice.retainerFeePkr + invoice.hearingFeePkr).toLocaleString()}
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
                  <span className="text-slate-500 font-sans font-semibold">Bank Name:</span> Bank Al-Habib Limited
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">Branch:</span> G-11 Markaz Branch Islamabad
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">Account Title:</span>{' '}
                  <span className="font-bold text-[#612912]">Rahim Law Associates</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-semibold">IBAN:</span>{' '}
                  <span className="font-bold break-all">PK67BAHL0321098101053501</span>
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
