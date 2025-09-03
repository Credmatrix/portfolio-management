import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null
            })
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: {}, error: null }),
            then: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
    })
}));

describe('Reporting Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Report Generation', () => {
        it('should validate report generation request', () => {
            const validRequest = {
                templateId: 'portfolio-overview',
                name: 'Test Report',
                description: 'Test Description',
                format: 'pdf' as const,
                sections: ['executive-summary', 'risk-distribution'],
                filters: {
                    industries: ['manufacturing'],
                    riskGrades: ['CM1', 'CM2'],
                    regions: ['north'],
                    dateRange: {
                        start: '2024-01-01',
                        end: '2024-12-31'
                    }
                },
                generatedAt: new Date().toISOString()
            };

            expect(validRequest.templateId).toBeDefined();
            expect(validRequest.name).toBeDefined();
            expect(validRequest.sections.length).toBeGreaterThan(0);
            expect(['pdf', 'excel', 'csv']).toContain(validRequest.format);
        });

        it('should generate executive summary content', () => {
            const mockPortfolioData = [
                {
                    company_name: 'Test Company 1',
                    risk_score: 85,
                    risk_grade: 'CM1',
                    recommended_limit: 10000000,
                    industry: 'manufacturing'
                },
                {
                    company_name: 'Test Company 2',
                    risk_score: 65,
                    risk_grade: 'CM2',
                    recommended_limit: 5000000,
                    industry: 'services'
                }
            ];

            const executiveSummary = generateExecutiveSummary(mockPortfolioData);

            expect(executiveSummary.totalCompanies).toBe(2);
            expect(executiveSummary.totalExposure).toBe(15000000);
            expect(executiveSummary.avgRiskScore).toBe(75);
            expect(executiveSummary.keyInsights).toHaveLength(2);
        });

        it('should calculate risk distribution correctly', () => {
            const mockData = [
                { risk_grade: 'CM1' },
                { risk_grade: 'CM1' },
                { risk_grade: 'CM2' },
                { risk_grade: 'CM3' }
            ];

            const riskDistribution = calculateRiskDistribution(mockData);

            expect(riskDistribution.CM1).toBe(2);
            expect(riskDistribution.CM2).toBe(1);
            expect(riskDistribution.CM3).toBe(1);
        });

        it('should generate industry breakdown', () => {
            const mockData = [
                { industry: 'manufacturing', recommended_limit: 10000000 },
                { industry: 'manufacturing', recommended_limit: 5000000 },
                { industry: 'services', recommended_limit: 8000000 }
            ];

            const industryBreakdown = generateIndustryBreakdown(mockData);

            expect(industryBreakdown.manufacturing.count).toBe(2);
            expect(industryBreakdown.manufacturing.totalExposure).toBe(15000000);
            expect(industryBreakdown.services.count).toBe(1);
            expect(industryBreakdown.services.totalExposure).toBe(8000000);
        });
    });

    describe('Export Functionality', () => {
        it('should validate export configuration', () => {
            const validExportConfig = {
                format: 'csv' as const,
                dataType: 'companies' as const,
                fields: ['company_name', 'risk_score', 'industry'],
                filters: {
                    industries: ['manufacturing'],
                    riskGrades: ['CM1'],
                    dateRange: {
                        start: '2024-01-01',
                        end: '2024-12-31'
                    }
                },
                includeHeaders: true,
                includeMetadata: false,
                exportedAt: new Date().toISOString()
            };

            expect(['csv', 'excel', 'pdf', 'json']).toContain(validExportConfig.format);
            expect(['portfolio', 'companies', 'analytics', 'compliance']).toContain(validExportConfig.dataType);
            expect(validExportConfig.fields.length).toBeGreaterThan(0);
        });

        it('should transform company data for export', () => {
            const mockCompanyData = [
                {
                    company_name: 'Test Company',
                    industry: 'manufacturing',
                    risk_score: 85,
                    risk_grade: 'CM1',
                    recommended_limit: 10000000,
                    extracted_data: {
                        financial_data: { revenue: 50000000 },
                        gst_records: { active_gstins: ['GST123'] },
                        directors: [{ name: 'John Doe' }]
                    }
                }
            ];

            const fields = ['company_name', 'industry', 'risk_score'];
            const transformedData = transformCompaniesData(mockCompanyData, fields);

            expect(transformedData).toHaveLength(1);
            expect(transformedData[0].company_name).toBe('Test Company');
            expect(transformedData[0].industry).toBe('manufacturing');
            expect(transformedData[0].risk_score).toBe(85);
        });

        it('should generate CSV content correctly', () => {
            const mockData = [
                { name: 'Company A', score: 85 },
                { name: 'Company B', score: 70 }
            ];

            const csvContent = generateCSVContent(mockData, true, true);

            expect(csvContent).toContain('name,score');
            expect(csvContent).toContain('Company A,85');
            expect(csvContent).toContain('Company B,70');
        });
    });

    describe('Scheduled Reports', () => {
        it('should calculate next run time for daily reports', () => {
            const schedule = {
                frequency: 'daily' as const,
                time: '09:00'
            };

            const nextRun = calculateNextRun(schedule);
            const nextRunDate = new Date(nextRun);

            expect(nextRunDate.getHours()).toBe(9);
            expect(nextRunDate.getMinutes()).toBe(0);
            expect(nextRunDate > new Date()).toBe(true);
        });

        it('should calculate next run time for weekly reports', () => {
            const schedule = {
                frequency: 'weekly' as const,
                dayOfWeek: 1, // Monday
                time: '10:30'
            };

            const nextRun = calculateNextRun(schedule);
            const nextRunDate = new Date(nextRun);

            expect(nextRunDate.getDay()).toBe(1); // Monday
            expect(nextRunDate.getHours()).toBe(10);
            expect(nextRunDate.getMinutes()).toBe(30);
        });

        it('should validate scheduled report configuration', () => {
            const validScheduledReport = {
                name: 'Weekly Risk Report',
                description: 'Weekly portfolio risk analysis',
                templateId: 'risk-assessment',
                schedule: {
                    frequency: 'weekly' as const,
                    dayOfWeek: 1,
                    time: '09:00'
                },
                recipients: ['user@example.com', 'manager@example.com'],
                format: 'pdf' as const,
                filters: {
                    industries: ['manufacturing'],
                    riskGrades: ['CM4', 'CM5']
                },
                isActive: true
            };

            expect(validScheduledReport.name).toBeDefined();
            expect(validScheduledReport.templateId).toBeDefined();
            expect(validScheduledReport.recipients.length).toBeGreaterThan(0);
            expect(['daily', 'weekly', 'monthly', 'quarterly']).toContain(validScheduledReport.schedule.frequency);

            // Validate email addresses
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            validScheduledReport.recipients.forEach(email => {
                expect(emailRegex.test(email)).toBe(true);
            });
        });
    });

    describe('Report Templates', () => {
        it('should validate template structure', () => {
            const validTemplate = {
                id: 'custom-template-1',
                name: 'Custom Portfolio Report',
                description: 'Custom analysis template',
                category: 'portfolio' as const,
                sections: ['executive-summary', 'risk-distribution', 'recommendations'],
                defaultFormat: 'pdf' as const,
                isBuiltIn: false,
                createdAt: new Date().toISOString(),
                createdBy: 'user@example.com',
                usageCount: 0
            };

            expect(validTemplate.name).toBeDefined();
            expect(validTemplate.sections.length).toBeGreaterThan(0);
            expect(['portfolio', 'risk', 'compliance', 'financial', 'custom']).toContain(validTemplate.category);
            expect(['pdf', 'excel', 'csv']).toContain(validTemplate.defaultFormat);
        });

        it('should get template sections correctly', () => {
            const portfolioSections = getTemplateSections('portfolio-overview');
            const riskSections = getTemplateSections('risk-assessment');

            expect(portfolioSections).toContain('executive-summary');
            expect(portfolioSections).toContain('portfolio-overview');
            expect(riskSections).toContain('risk-distribution');
            expect(riskSections).toContain('parameter-analysis');
        });
    });

    describe('Report Content Generation', () => {
        it('should generate compliance status report', () => {
            const mockData = [
                {
                    extracted_data: {
                        gst_records: { active_gstins: ['GST123'] },
                        epfo_records: { establishments: ['EST123'] }
                    }
                },
                {
                    extracted_data: {
                        gst_records: { active_gstins: [] },
                        epfo_records: { establishments: ['EST456'] }
                    }
                }
            ];

            const complianceStatus = generateComplianceStatus(mockData);

            expect(complianceStatus.gstCompliance.compliant).toBe(1);
            expect(complianceStatus.gstCompliance.total).toBe(2);
            expect(complianceStatus.epfoCompliance.compliant).toBe(2);
            expect(complianceStatus.epfoCompliance.total).toBe(2);
        });

        it('should identify top performers', () => {
            const mockData = [
                { company_name: 'Company A', risk_score: 85, risk_grade: 'CM1' },
                { company_name: 'Company B', risk_score: 75, risk_grade: 'CM2' },
                { company_name: 'Company C', risk_score: 65, risk_grade: 'CM2' },
                { company_name: 'Company D', risk_score: 90, risk_grade: 'CM1' }
            ];

            const topPerformers = generateTopPerformers(mockData);

            expect(topPerformers).toHaveLength(3); // Only companies with score >= 70
            expect(topPerformers[0].name).toBe('Company D'); // Highest score first
            expect(topPerformers[0].riskScore).toBe(90);
        });

        it('should identify high-risk companies', () => {
            const mockData = [
                { company_name: 'Company A', risk_score: 85, risk_grade: 'CM1' },
                { company_name: 'Company B', risk_score: 35, risk_grade: 'CM4' },
                { company_name: 'Company C', risk_score: 20, risk_grade: 'CM5' },
                { company_name: 'Company D', risk_score: 75, risk_grade: 'CM2' }
            ];

            const highRiskCompanies = generateHighRiskCompanies(mockData);

            expect(highRiskCompanies).toHaveLength(2); // Only CM4 and CM5
            expect(highRiskCompanies.some(c => c.name === 'Company B')).toBe(true);
            expect(highRiskCompanies.some(c => c.name === 'Company C')).toBe(true);
        });
    });
});

// Helper functions for testing
function generateExecutiveSummary(data: any[]) {
    const totalCompanies = data.length;
    const totalExposure = data.reduce((sum, company) => sum + (company.recommended_limit || 0), 0);
    const avgRiskScore = data.reduce((sum, company) => sum + (company.risk_score || 0), 0) / totalCompanies;

    return {
        totalCompanies,
        totalExposure,
        avgRiskScore,
        keyInsights: [
            `Portfolio contains ${totalCompanies} companies`,
            `Average risk score is ${avgRiskScore.toFixed(1)}%`
        ]
    };
}

function calculateRiskDistribution(data: any[]) {
    return data.reduce((acc, company) => {
        const grade = company.risk_grade || 'Ungraded';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});
}

function generateIndustryBreakdown(data: any[]) {
    return data.reduce((acc, company) => {
        const industry = company.industry || 'Unknown';
        if (!acc[industry]) {
            acc[industry] = { count: 0, totalExposure: 0 };
        }
        acc[industry].count++;
        acc[industry].totalExposure += company.recommended_limit || 0;
        return acc;
    }, {});
}

function transformCompaniesData(data: any[], fields: string[]) {
    return data.map(item => {
        const transformed: any = {};
        fields.forEach(field => {
            transformed[field] = item[field];
        });
        return transformed;
    });
}

function generateCSVContent(data: any[], includeHeaders: boolean, includeMetadata: boolean) {
    let content = '';

    if (includeMetadata) {
        content += '# Generated: ' + new Date().toISOString() + '\n';
    }

    if (data.length > 0) {
        if (includeHeaders) {
            content += Object.keys(data[0]).join(',') + '\n';
        }

        data.forEach(row => {
            content += Object.values(row).join(',') + '\n';
        });
    }

    return content;
}

function calculateNextRun(schedule: any): string {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
        case 'daily':
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            break;
        case 'weekly':
            const targetDayOfWeek = schedule.dayOfWeek || 1;
            const currentDayOfWeek = nextRun.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
            if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
                daysUntilTarget += 7;
            }
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
            break;
    }

    return nextRun.toISOString();
}

function getTemplateSections(templateId: string): string[] {
    const templateSections: { [key: string]: string[] } = {
        'portfolio-overview': ['executive-summary', 'portfolio-overview', 'risk-distribution', 'industry-breakdown', 'top-performers'],
        'risk-assessment': ['risk-distribution', 'parameter-analysis', 'high-risk-companies', 'compliance-status', 'recommendations']
    };
    return templateSections[templateId] || ['executive-summary'];
}

function generateComplianceStatus(data: any[]) {
    const gstCompliant = data.filter(c => c.extracted_data?.gst_records?.active_gstins?.length > 0).length;
    const epfoCompliant = data.filter(c => c.extracted_data?.epfo_records?.establishments?.length > 0).length;

    return {
        gstCompliance: { compliant: gstCompliant, total: data.length },
        epfoCompliance: { compliant: epfoCompliant, total: data.length }
    };
}

function generateTopPerformers(data: any[]) {
    return data
        .filter(company => company.risk_score >= 70)
        .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
        .slice(0, 10)
        .map(company => ({
            name: company.company_name,
            riskScore: company.risk_score,
            riskGrade: company.risk_grade
        }));
}

function generateHighRiskCompanies(data: any[]) {
    return data
        .filter(company => company.risk_grade === 'CM4' || company.risk_grade === 'CM5')
        .map(company => ({
            name: company.company_name,
            riskScore: company.risk_score,
            riskGrade: company.risk_grade
        }));
}