// Manual Processing Pipeline Service
// Handles document processing request generation, risk analysis, and data completeness scoring

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    ManualCompanyEntry,
    EntityType,
    ProcessingStatus,
    DataQualityIndicators,
    QualityIssue,
    ImprovementSuggestion,
    ValidationError
} from '@/types/manual-company.types';
import { v4 as uuidv4 } from 'uuid';

export interface ManualProcessingRequest {
    entity_type: EntityType;
    basic_details: any;
    ownership_structure?: any;
    financial_data?: any;
    compliance_data?: any;
    user_id: string;
}

export interface ProcessingResult {
    request_id: string;
    status: ProcessingStatus;
    data_completeness_score: number;
    data_quality_indicators: DataQualityIndicators;
    risk_analysis?: RiskAnalysisResult;
    processing_notes?: string;
}

export interface RiskAnalysisResult {
    overall_risk_score: number;
    risk_category: 'low' | 'medium' | 'high' | 'very_high';
    risk_factors: RiskFactor[];
    financial_health_score?: number;
    compliance_score?: number;
    governance_score?: number;
    recommendations: string[];
}

export interface RiskFactor {
    category: 'financial' | 'compliance' | 'governance' | 'operational';
    factor: string;
    impact: 'low' | 'medium' | 'high';
    score: number;
    description: string;
}

export class ManualProcessingService {
    private supabase: any;

    constructor() {
        this.initializeSupabase();
    }

    private async initializeSupabase() {
        this.supabase = await createServerSupabaseClient();
    }

    /**
     * Process manual company entry and generate document processing request
     */
    async processManualEntry(request: ManualProcessingRequest): Promise<ProcessingResult> {
        try {
            const requestId = uuidv4();

            // Calculate data completeness score
            const completenessScore = this.calculateDataCompletenessScore(request);

            // Generate data quality indicators
            const qualityIndicators = this.generateDataQualityIndicators(request);

            // Perform risk analysis with available data
            const riskAnalysis = this.calculateRiskAnalysis(request);

            // Create manual company entry record
            const manualEntry: Partial<ManualCompanyEntry> = {
                id: uuidv4(),
                request_id: requestId,
                entity_type: request.entity_type,
                data_source: 'manual',
                basic_details: request.basic_details,
                ownership_structure: request.ownership_structure,
                financial_data: request.financial_data,
                compliance_data: request.compliance_data,
                data_completeness_score: completenessScore,
                data_quality_indicators: qualityIndicators,
                processing_status: 'processing',
                created_by: request.user_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Insert manual entry record
            const { error: entryError } = await this.supabase
                .from('manual_company_entries')
                .insert(manualEntry);

            if (entryError) {
                throw new Error(`Failed to create manual entry: ${entryError.message}`);
            }

            // Create document processing request
            const { error: requestError } = await this.supabase
                .from('document_processing_requests')
                .insert({
                    id: requestId,
                    entity_type: request.entity_type,
                    processing_method: 'manual',
                    status: 'processing',
                    processing_started_at: new Date().toISOString(),
                    user_id: request.user_id,
                    metadata: {
                        data_source: 'manual',
                        completeness_score: completenessScore,
                        risk_analysis: riskAnalysis
                    }
                });

            if (requestError) {
                throw new Error(`Failed to create processing request: ${requestError.message}`);
            }

            // Generate processing notes
            const processingNotes = this.generateProcessingNotes(request, completenessScore, riskAnalysis);

            // Update status to completed for manual entries (no external processing needed)
            await this.updateProcessingStatus(requestId, 'completed', processingNotes);

            return {
                request_id: requestId,
                status: 'completed',
                data_completeness_score: completenessScore,
                data_quality_indicators: qualityIndicators,
                risk_analysis: riskAnalysis,
                processing_notes: processingNotes
            };

        } catch (error) {
            console.error('Manual processing error:', error);
            throw error;
        }
    }

    /**
     * Calculate data completeness score based on available information
     */
    private calculateDataCompletenessScore(request: ManualProcessingRequest): number {
        let totalFields = 0;
        let completedFields = 0;

        // Basic details scoring (40% weight)
        const basicDetailsFields = [
            'legal_name', 'entity_type', 'registration_number', 'registration_date',
            'registered_address', 'contact_details', 'industry_classification'
        ];

        totalFields += basicDetailsFields.length;
        basicDetailsFields.forEach(field => {
            if (this.hasValue(request.basic_details?.[field])) {
                completedFields++;
            }
        });

        // Ownership structure scoring (25% weight)
        if (request.ownership_structure) {
            const ownershipFields = ['directors', 'partners', 'owners', 'shareholding'];
            const applicableFields = ownershipFields.filter(field =>
                this.isFieldApplicableForEntity(field, request.entity_type)
            );

            totalFields += applicableFields.length;
            applicableFields.forEach(field => {
                if (this.hasValue(request.ownership_structure?.[field])) {
                    completedFields++;
                }
            });
        }

        // Financial data scoring (25% weight)
        if (request.financial_data) {
            const financialFields = ['balance_sheet', 'profit_loss', 'ratios'];
            totalFields += financialFields.length;
            financialFields.forEach(field => {
                if (this.hasValue(request.financial_data?.[field])) {
                    completedFields++;
                }
            });
        }

        // Compliance data scoring (10% weight)
        if (request.compliance_data) {
            const complianceFields = ['gst_data', 'epfo_data', 'legal_data'];
            totalFields += complianceFields.length;
            complianceFields.forEach(field => {
                if (this.hasValue(request.compliance_data?.[field])) {
                    completedFields++;
                }
            });
        }

        return Math.round((completedFields / totalFields) * 100);
    }

    /**
     * Generate comprehensive data quality indicators
     */
    private generateDataQualityIndicators(request: ManualProcessingRequest): DataQualityIndicators {
        const completenessScore = this.calculateDataCompletenessScore(request);
        const accuracyScore = this.calculateAccuracyScore(request);
        const consistencyScore = this.calculateConsistencyScore(request);
        const timelinessScore = this.calculateTimelinessScore(request);

        const overallScore = Math.round(
            (completenessScore * 0.4 + accuracyScore * 0.3 + consistencyScore * 0.2 + timelinessScore * 0.1)
        );

        const qualityIssues = this.identifyQualityIssues(request);
        const improvementSuggestions = this.generateImprovementSuggestions(request, qualityIssues);

        return {
            completeness_score: completenessScore,
            accuracy_score: accuracyScore,
            consistency_score: consistencyScore,
            timeliness_score: timelinessScore,
            overall_quality_score: overallScore,
            quality_issues: qualityIssues,
            improvement_suggestions: improvementSuggestions,
            last_updated: new Date().toISOString(),
            next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        };
    }

    /**
     * Calculate risk analysis with available data
     */
    private calculateRiskAnalysis(request: ManualProcessingRequest): RiskAnalysisResult {
        const riskFactors: RiskFactor[] = [];
        let totalRiskScore = 0;

        // Financial risk assessment
        if (request.financial_data) {
            const financialRisk = this.assessFinancialRisk(request.financial_data);
            riskFactors.push(...financialRisk.factors);
            totalRiskScore += financialRisk.score;
        } else {
            riskFactors.push({
                category: 'financial',
                factor: 'missing_financial_data',
                impact: 'high',
                score: 75,
                description: 'No financial data available for risk assessment'
            });
            totalRiskScore += 75;
        }

        // Compliance risk assessment
        if (request.compliance_data) {
            const complianceRisk = this.assessComplianceRisk(request.compliance_data);
            riskFactors.push(...complianceRisk.factors);
            totalRiskScore += complianceRisk.score;
        } else {
            riskFactors.push({
                category: 'compliance',
                factor: 'missing_compliance_data',
                impact: 'medium',
                score: 50,
                description: 'Limited compliance information available'
            });
            totalRiskScore += 50;
        }

        // Governance risk assessment
        const governanceRisk = this.assessGovernanceRisk(request);
        riskFactors.push(...governanceRisk.factors);
        totalRiskScore += governanceRisk.score;

        // Calculate average risk score
        const overallRiskScore = Math.round(totalRiskScore / 3);

        // Determine risk category
        let riskCategory: 'low' | 'medium' | 'high' | 'very_high';
        if (overallRiskScore <= 25) riskCategory = 'low';
        else if (overallRiskScore <= 50) riskCategory = 'medium';
        else if (overallRiskScore <= 75) riskCategory = 'high';
        else riskCategory = 'very_high';

        // Generate recommendations
        const recommendations = this.generateRiskRecommendations(riskFactors, riskCategory);

        return {
            overall_risk_score: overallRiskScore,
            risk_category: riskCategory,
            risk_factors: riskFactors,
            financial_health_score: request.financial_data ? this.calculateFinancialHealthScore(request.financial_data) : undefined,
            compliance_score: request.compliance_data ? this.calculateComplianceScore(request.compliance_data) : undefined,
            governance_score: this.calculateGovernanceScore(request),
            recommendations
        };
    }

    /**
     * Update processing status
     */
    async updateProcessingStatus(
        requestId: string,
        status: ProcessingStatus,
        notes?: string
    ): Promise<void> {
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'completed') {
            updateData.processing_completed_at = new Date().toISOString();
        }

        if (notes) {
            updateData.processing_notes = notes;
        }

        await this.supabase
            .from('document_processing_requests')
            .update(updateData)
            .eq('id', requestId);

        // Also update manual entry status
        await this.supabase
            .from('manual_company_entries')
            .update({
                processing_status: status,
                processing_notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);
    }

    // Helper methods
    private hasValue(value: any): boolean {
        return value !== null && value !== undefined && value !== '' &&
            (Array.isArray(value) ? value.length > 0 : true);
    }

    private isFieldApplicableForEntity(field: string, entityType: EntityType): boolean {
        const fieldMapping: Record<string, EntityType[]> = {
            'directors': ['private_limited', 'public_limited'],
            'partners': ['partnership_registered', 'partnership_unregistered', 'llp'],
            'owners': ['proprietorship', 'huf'],
            'trustees': ['trust_private', 'trust_public'],
            'members': ['society'],
            'shareholding': ['private_limited', 'public_limited']
        };

        return fieldMapping[field]?.includes(entityType) || false;
    }

    private calculateAccuracyScore(request: ManualProcessingRequest): number {
        // Implement accuracy scoring logic based on data validation
        return 85; // Placeholder
    }

    private calculateConsistencyScore(request: ManualProcessingRequest): number {
        // Implement consistency scoring logic
        return 90; // Placeholder
    }

    private calculateTimelinessScore(request: ManualProcessingRequest): number {
        // Implement timeliness scoring logic
        return 95; // Placeholder
    }

    private identifyQualityIssues(request: ManualProcessingRequest): QualityIssue[] {
        const issues: QualityIssue[] = [];

        // Check for missing critical data
        if (!request.basic_details?.legal_name) {
            issues.push({
                category: 'missing_data',
                severity: 'critical',
                field_path: 'basic_details.legal_name',
                description: 'Company legal name is required',
                suggested_action: 'Enter the complete legal name of the entity'
            });
        }

        if (!request.financial_data) {
            issues.push({
                category: 'missing_data',
                severity: 'high',
                field_path: 'financial_data',
                description: 'No financial data provided',
                suggested_action: 'Add financial statements for better risk assessment'
            });
        }

        return issues;
    }

    private generateImprovementSuggestions(
        request: ManualProcessingRequest,
        issues: QualityIssue[]
    ): ImprovementSuggestion[] {
        const suggestions: ImprovementSuggestion[] = [];

        if (issues.some(i => i.category === 'missing_data')) {
            suggestions.push({
                type: 'manual_update',
                priority: 'high',
                description: 'Complete missing required fields to improve data quality',
                estimated_impact: 'Significant improvement in risk assessment accuracy',
                implementation_effort: 'medium'
            });
        }

        return suggestions;
    }

    private assessFinancialRisk(financialData: any): { factors: RiskFactor[], score: number } {
        const factors: RiskFactor[] = [];
        let score = 30; // Base score

        // Implement financial risk assessment logic
        return { factors, score };
    }

    private assessComplianceRisk(complianceData: any): { factors: RiskFactor[], score: number } {
        const factors: RiskFactor[] = [];
        let score = 25; // Base score

        // Implement compliance risk assessment logic
        return { factors, score };
    }

    private assessGovernanceRisk(request: ManualProcessingRequest): { factors: RiskFactor[], score: number } {
        const factors: RiskFactor[] = [];
        let score = 20; // Base score

        // Implement governance risk assessment logic
        return { factors, score };
    }

    private calculateFinancialHealthScore(financialData: any): number {
        // Implement financial health scoring
        return 75; // Placeholder
    }

    private calculateComplianceScore(complianceData: any): number {
        // Implement compliance scoring
        return 80; // Placeholder
    }

    private calculateGovernanceScore(request: ManualProcessingRequest): number {
        // Implement governance scoring
        return 70; // Placeholder
    }

    private generateRiskRecommendations(
        riskFactors: RiskFactor[],
        riskCategory: string
    ): string[] {
        const recommendations: string[] = [];

        if (riskCategory === 'high' || riskCategory === 'very_high') {
            recommendations.push('Consider requiring additional documentation before credit approval');
            recommendations.push('Implement enhanced monitoring and review frequency');
        }

        if (riskFactors.some(f => f.category === 'financial')) {
            recommendations.push('Request updated financial statements and cash flow projections');
        }

        if (riskFactors.some(f => f.category === 'compliance')) {
            recommendations.push('Verify compliance status with relevant regulatory authorities');
        }

        return recommendations;
    }

    private generateProcessingNotes(
        request: ManualProcessingRequest,
        completenessScore: number,
        riskAnalysis: RiskAnalysisResult
    ): string {
        const notes = [
            `Manual entry processed for ${request.entity_type} entity`,
            `Data completeness: ${completenessScore}%`,
            `Risk category: ${riskAnalysis.risk_category}`,
            `Overall risk score: ${riskAnalysis.overall_risk_score}/100`
        ];

        if (completenessScore < 70) {
            notes.push('Note: Low data completeness may affect risk assessment accuracy');
        }

        if (riskAnalysis.risk_category === 'high' || riskAnalysis.risk_category === 'very_high') {
            notes.push('Warning: High risk profile detected - additional review recommended');
        }

        return notes.join('. ');
    }
}

// Export singleton instance
export const manualProcessingService = new ManualProcessingService();