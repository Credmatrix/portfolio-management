/**
 * Parameter Correlation Analysis API Endpoint
 * 
 * Provides parameter correlation analysis including:
 * - Parameter-to-parameter correlations
 * - Category correlations
 * - Risk driver identification
 * - Portfolio insights
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        // Mock correlation data - in real implementation, this would come from database analysis
        const mockCorrelationData = {
            parameterCorrelations: generateParameterCorrelations(),
            categoryCorrelations: generateCategoryCorrelations(),
            riskDrivers: generateRiskDrivers(),
            portfolioInsights: {
                strongestCorrelation: {
                    parameters: ['Current Ratio', 'Quick Ratio'],
                    correlation: 0.892
                },
                weakestCorrelation: {
                    parameters: ['GST Compliance', 'Inventory Days'],
                    correlation: 0.045
                },
                keyRiskDrivers: [
                    'Debt to Equity Ratio',
                    'Interest Coverage Ratio',
                    'Working Capital Days',
                    'EBITDA Margin'
                ],
                diversificationOpportunities: [
                    'GST Compliance Score',
                    'Director Experience',
                    'Geographic Diversification',
                    'Audit Quality'
                ]
            }
        };

        return NextResponse.json({
            success: true,
            data: mockCorrelationData,
            metadata: {
                companyId,
                analysis_type: companyId ? 'company_specific' : 'portfolio_wide',
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Parameter correlation analysis error:', error);
        return NextResponse.json({
            error: 'Failed to generate parameter correlation analysis',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function generateParameterCorrelations() {
    const parameters = [
        { name: 'Current Ratio', category: 'Financial' },
        { name: 'Quick Ratio', category: 'Financial' },
        { name: 'Debt to Equity', category: 'Financial' },
        { name: 'Interest Coverage', category: 'Financial' },
        { name: 'EBITDA Margin', category: 'Financial' },
        { name: 'ROE', category: 'Financial' },
        { name: 'Working Capital Days', category: 'Business' },
        { name: 'Inventory Days', category: 'Business' },
        { name: 'Debtor Days', category: 'Business' },
        { name: 'Revenue Growth', category: 'Business' },
        { name: 'GST Compliance', category: 'Hygiene' },
        { name: 'EPFO Compliance', category: 'Hygiene' },
        { name: 'Audit Quality', category: 'Hygiene' },
        { name: 'Legal Cases', category: 'Hygiene' },
        { name: 'Banking Relationship', category: 'Banking' },
        { name: 'Credit History', category: 'Banking' },
        { name: 'Collateral Coverage', category: 'Banking' }
    ];

    const correlations: any[] = [];

    for (let i = 0; i < parameters.length; i++) {
        for (let j = i + 1; j < parameters.length; j++) {
            const param1 = parameters[i];
            const param2 = parameters[j];

            // Generate realistic correlations based on parameter types
            let correlation = (Math.random() - 0.5) * 2; // -1 to 1

            // Make some correlations more realistic
            if (param1.name === 'Current Ratio' && param2.name === 'Quick Ratio') {
                correlation = 0.85 + Math.random() * 0.1; // High positive correlation
            } else if (param1.name === 'Debt to Equity' && param2.name === 'Interest Coverage') {
                correlation = -0.6 - Math.random() * 0.2; // Negative correlation
            } else if (param1.category === param2.category) {
                correlation = Math.abs(correlation) * 0.7; // Same category tends to be positive
            }

            correlations.push({
                parameter1: param1.name,
                parameter2: param2.name,
                correlation: Math.round(correlation * 1000) / 1000,
                significance: 0.8 + Math.random() * 0.19, // 80-99% significance
                category1: param1.category,
                category2: param2.category
            });
        }
    }

    return correlations;
}

function generateCategoryCorrelations() {
    const categories = ['Financial', 'Business', 'Hygiene', 'Banking'];
    const correlations: any[] = [];

    for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
            correlations.push({
                category1: categories[i],
                category2: categories[j],
                correlation: Math.round((Math.random() * 0.8 + 0.1) * 1000) / 1000, // 0.1 to 0.9
                significance: 0.85 + Math.random() * 0.14 // 85-99% significance
            });
        }
    }

    return correlations;
}

function generateRiskDrivers() {
    return [
        {
            parameter: 'Debt to Equity Ratio',
            category: 'Financial',
            riskImpact: 0.85,
            importance: 0.92,
            description: 'High leverage significantly increases financial risk'
        },
        {
            parameter: 'Interest Coverage Ratio',
            category: 'Financial',
            riskImpact: 0.78,
            importance: 0.88,
            description: 'Low coverage indicates difficulty servicing debt'
        },
        {
            parameter: 'Working Capital Days',
            category: 'Business',
            riskImpact: 0.72,
            importance: 0.75,
            description: 'Extended working capital cycle affects liquidity'
        },
        {
            parameter: 'EBITDA Margin',
            category: 'Financial',
            riskImpact: 0.69,
            importance: 0.82,
            description: 'Low profitability margins indicate operational stress'
        },
        {
            parameter: 'GST Compliance Score',
            category: 'Hygiene',
            riskImpact: 0.65,
            importance: 0.71,
            description: 'Poor compliance indicates governance issues'
        },
        {
            parameter: 'Current Ratio',
            category: 'Financial',
            riskImpact: 0.58,
            importance: 0.68,
            description: 'Low liquidity ratios indicate short-term payment risk'
        },
        {
            parameter: 'Revenue Growth',
            category: 'Business',
            riskImpact: 0.52,
            importance: 0.64,
            description: 'Declining revenues indicate business sustainability risk'
        },
        {
            parameter: 'Legal Cases',
            category: 'Hygiene',
            riskImpact: 0.48,
            importance: 0.55,
            description: 'Pending litigation creates contingent liabilities'
        },
        {
            parameter: 'Banking Relationship',
            category: 'Banking',
            riskImpact: 0.45,
            importance: 0.58,
            description: 'Poor banking relationships limit financing options'
        },
        {
            parameter: 'Audit Quality',
            category: 'Hygiene',
            riskImpact: 0.42,
            importance: 0.51,
            description: 'Qualified audits indicate financial reporting concerns'
        }
    ];
}