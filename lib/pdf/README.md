# PDF Export System

This directory contains the PDF generation system for research reports using React PDF.

## Overview

The PDF export system generates professional due diligence reports with:
- Cover page with company information and risk assessment
- Table of contents with page numbers
- Formatted report sections with markdown support
- Professional styling and branding
- Legal disclaimer page
- Page headers and footers

## Architecture

### Components

1. **PDF Components** (`pdf-components.tsx`)
   - `CoverPage`: Professional cover page with company details
   - `TableOfContents`: Navigable index with page numbers
   - `ReportSection`: Formatted content sections with markdown parsing
   - `DisclaimerPage`: Legal disclaimer and contact information
   - `PDFHeader`: Page headers with title and page numbers
   - `PDFFooter`: Page footers with generation date

2. **PDF Generator Service** (`../services/pdf-generator.service.ts`)
   - `generateReportPDF()`: Full report generation
   - `generateSummaryPDF()`: Executive summary only
   - `validateReportData()`: Data validation
   - `getPDFMetadata()`: Response headers and metadata

3. **Export Handler** (`../utils/pdf-export-handler.ts`)
   - Browser compatibility checks
   - Error handling and user feedback
   - Progress tracking
   - File download management

## API Endpoints

### Export Report
```
GET /api/deep-research/reports/[reportId]/export?format=pdf&type=full
GET /api/deep-research/reports/[reportId]/export?format=pdf&type=summary
```

**Parameters:**
- `format`: Currently only 'pdf' supported
- `type`: 'full' (complete report) or 'summary' (executive summary only)

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="report-name.pdf"`
- Binary PDF data

### Test Endpoint
```
GET /api/deep-research/reports/[reportId]/export/test
POST /api/deep-research/reports/[reportId]/export/test
```

For development and testing PDF generation with mock data.

## Usage

### Frontend Integration

```typescript
import { PDFExportHandler } from '@/lib/utils/pdf-export-handler'

// Export full report
await PDFExportHandler.exportReport(reportId, {
  type: 'full',
  onStart: () => setLoading(true),
  onSuccess: (filename) => showSuccess(`Downloaded ${filename}`),
  onError: (error) => showError(error)
})

// Export summary
await PDFExportHandler.exportReport(reportId, {
  type: 'summary',
  onStart: () => setLoading(true),
  onSuccess: (filename) => showSuccess(`Downloaded ${filename}`),
  onError: (error) => showError(error)
})
```

### Backend Usage

```typescript
import { PDFGeneratorService } from '@/lib/services/pdf-generator.service'

// Generate PDF buffer
const pdfBuffer = await PDFGeneratorService.generateReportPDF(reportData, {
  includeTableOfContents: true,
  includeDisclaimer: true,
  customTitle: 'Custom Report Title'
})

// Get response metadata
const metadata = PDFGeneratorService.getPDFMetadata(reportData, 'full')

// Return as HTTP response
return new NextResponse(pdfBuffer, {
  headers: metadata.headers
})
```

## Report Data Structure

```typescript
interface ReportData {
  id: string
  title: string
  sections: Record<string, string>  // Section name -> markdown content
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
  generated_at: string
  report_type: string
  company_info?: {
    name: string
    industry?: string
    location?: string
  }
  findings_summary?: {
    critical_findings?: number
    high_risk_findings?: number
    medium_risk_findings?: number
    low_risk_findings?: number
    total_findings?: number
  }
}
```

## Styling and Branding

### Colors
- Primary: `#2563eb` (Blue)
- Secondary: `#64748b` (Slate)
- Success: `#059669` (Green)
- Warning: `#d97706` (Amber)
- Error: `#dc2626` (Red)

### Typography
- Font Family: Inter (loaded from Google Fonts)
- Headers: Bold, hierarchical sizing
- Body: Regular weight, justified text
- Code: Monospace with syntax highlighting

### Layout
- Page Size: A4
- Margins: 40pt all sides
- Header Height: 30pt
- Footer Height: 20pt
- Content Area: Responsive with proper spacing

## Markdown Support

The PDF generator supports a subset of markdown:

- **Headers**: `#`, `##`, `###` (converted to styled headings)
- **Lists**: `- item` or `* item` (converted to bullet points)
- **Bold**: `**text**` (highlighted with background)
- **Italic**: `*text*` (italic styling)
- **Code**: `` `code` `` (monospace with background)
- **Paragraphs**: Regular text (justified alignment)

## Error Handling

### Validation Errors
- Missing required fields
- Invalid data types
- Empty sections

### Generation Errors
- React PDF rendering failures
- Font loading issues
- Memory constraints

### Network Errors
- API endpoint failures
- Timeout issues
- Browser compatibility

## Performance Considerations

### Optimization
- Lazy font loading
- Efficient markdown parsing
- Minimal component re-renders
- Buffer streaming for large reports

### Limitations
- Maximum report size: ~50 sections
- Image support: Limited to base64 embedded
- Complex layouts: Use flexbox instead of CSS Grid
- Memory usage: Monitor for large reports

## Browser Compatibility

### Supported
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Requirements
- `window.URL.createObjectURL` support
- `Blob` constructor support
- Modern JavaScript features (ES2020+)

## Development

### Testing
```bash
# Test PDF generation
curl "http://localhost:3000/api/deep-research/reports/test-id/export/test"

# Test with custom data
curl -X POST "http://localhost:3000/api/deep-research/reports/test-id/export/test" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Report", "sections": {"Test": "Content"}}'
```

### Debugging
1. Check browser console for React PDF errors
2. Verify font loading in Network tab
3. Test with minimal data first
4. Use test endpoint for development

### Adding New Features
1. Update PDF components for new layouts
2. Extend markdown parser for new syntax
3. Add validation for new data fields
4. Update TypeScript interfaces
5. Test across browsers

## Security Considerations

- Input sanitization for markdown content
- File size limits for generated PDFs
- Rate limiting on export endpoints
- Access control for sensitive reports
- Secure filename generation

## Future Enhancements

- [ ] Chart and graph embedding
- [ ] Custom branding/themes
- [ ] Batch export functionality
- [ ] Email delivery integration
- [ ] Digital signatures
- [ ] Watermarking
- [ ] Advanced table layouts
- [ ] Image optimization