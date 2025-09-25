import React from 'react'
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer'

// Simple test PDF to validate basic functionality
const TestPDF = () => React.createElement(Document, {}, [
    React.createElement(Page, { key: 'test-page', size: 'A4', style: { padding: 40 } }, [
        React.createElement(View, { key: 'content' }, [
            React.createElement(Text, { key: 'title', style: { fontSize: 24, marginBottom: 20 } }, 'Test PDF'),
            React.createElement(Text, { key: 'content-text' }, 'This is a test PDF to validate React PDF functionality.')
        ])
    ])
])

export async function generateTestPDF(): Promise<Buffer> {
    try {
        const pdfInstance = pdf(React.createElement(TestPDF))
        const buffer = await pdfInstance.toBuffer()
        return buffer
    } catch (error) {
        console.error('Test PDF generation error:', error)
        throw error
    }
}