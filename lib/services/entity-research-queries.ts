// Comprehensive Entity Research Query Templates
// Enhanced research queries for directors, subsidiaries, associates, and corporate networks

export interface EntityResearchContext {
    company_name: string;
    cin?: string;
    pan?: string;
    industry?: string;
    directors?: DirectorInfo[];
    subsidiaries?: SubsidiaryInfo[];
    associates?: AssociateInfo[];
}

export interface DirectorInfo {
    name: string;
    designation: string;
    din?: string;
    pan?: string;
    appointment_date?: string;
}

export interface SubsidiaryInfo {
    name: string;
    cin?: string;
    ownership_percentage?: number;
    relationship_type: string;
}

export interface AssociateInfo {
    name: string;
    cin?: string;
    relationship_type: string;
    business_relationship?: string;
}

export interface EntityResearchQuery {
    query_type: 'directors_comprehensive' | 'corporate_structure' | 'related_parties' | 'cross_directorship';
    query_template: string;
    search_parameters: {
        search_depth: 'exhaustive';
        entity_focus: string[];
        time_period_months: number;
        verification_required: boolean;
    };
    expected_findings: string[];
}

/**
 * Comprehensive Directors Research Query Template
 * Analyzes individual directors, their backgrounds, cross-directorships, and regulatory history
 */
export const DIRECTORS_COMPREHENSIVE_QUERY = (context: EntityResearchContext): EntityResearchQuery => ({
    query_type: 'directors_comprehensive',
    query_template: `
COMPREHENSIVE DIRECTORS DUE DILIGENCE RESEARCH

TARGET COMPANY: ${context.company_name}
${context.cin ? `CIN: ${context.cin}` : ''}
${context.industry ? `INDUSTRY: ${context.industry}` : ''}

DIRECTORS TO RESEARCH:
${context.directors?.map(d => `- ${d.name} (${d.designation})${d.din ? ` - DIN: ${d.din}` : ''}`).join('\n') || 'Extract director information from company filings'}

COMPREHENSIVE RESEARCH SCOPE:

1. INDIVIDUAL DIRECTOR BACKGROUND VERIFICATION
   For each director, conduct exhaustive research on:
   
   A. PROFESSIONAL HISTORY AND QUALIFICATIONS
      - Complete career progression and employment history
      - Educational background and professional certifications
      - Industry experience and domain expertise
      - Leadership roles and management positions
      - Professional achievements and recognition
   
   B. REGULATORY AND COMPLIANCE HISTORY
      - SEBI enforcement actions, penalties, or sanctions
      - MCA compliance violations or disqualifications
      - RBI actions or banking sector restrictions
      - Tax authority disputes or penalties for IT or ED
      - Industry-specific regulatory issues
      - Professional license suspensions or revocations
   
   C. LEGAL AND CRIMINAL BACKGROUND
      - Criminal charges, convictions, or ongoing cases
      - Civil litigation as defendant or plaintiff
      - Bankruptcy or insolvency proceedings
      - Financial misconduct allegations
      - Corporate fraud or embezzlement cases
      - Court orders or judicial restrictions
   
   D. FINANCIAL CONDUCT AND INTEGRITY
      - Personal bankruptcy or debt defaults
      - Loan defaults or financial irregularities
      - Related party transaction violations
      - Insider trading allegations or penalties
      - Financial reporting irregularities
      - Audit qualifications related to director conduct

2. CROSS-DIRECTORSHIP AND CORPORATE NETWORK ANALYSIS
   
   A. CURRENT BOARD POSITIONS
      - All current directorships across public and private companies
      - Board committee memberships and chairmanships
      - Independent vs executive director classifications
      - Compensation and remuneration details
      - Board meeting attendance records
   
   B. HISTORICAL DIRECTORSHIP ANALYSIS
      - Past 10 years of board positions and resignations
      - Companies that failed or went into liquidation during tenure
      - Resignations under adverse circumstances
      - Pattern analysis of directorship changes
      - Overlapping board memberships creating conflicts
   
   C. CORPORATE GOVERNANCE CONCERNS
      - Multiple directorships in competing companies
      - Potential conflicts of interest identification
      - Related party transaction approvals
      - Board independence compromises
      - Governance failures or lapses during tenure

3. BUSINESS RELATIONSHIPS AND NETWORKS
   
   A. BUSINESS PARTNERSHIPS AND VENTURES
      - Joint ventures and partnership arrangements
      - Business associates and key relationships
      - Investment partnerships and fund associations
      - Consulting or advisory roles
      - Significant business transactions or deals
   
   B. FAMILY AND PERSONAL CONNECTIONS
      - Family members in business or corporate roles
      - Spouse or relative business interests
      - Personal guarantees for corporate obligations
      - Property or asset transactions with companies
      - Trust or holding company structures

4. REPUTATION AND MEDIA ANALYSIS
   
   A. ADVERSE MEDIA COVERAGE
      - Negative news articles or investigative reports
      - Business failures or corporate scandals
      - Stakeholder disputes or controversies
      - Public criticism or adverse commentary
      - Social media controversies or issues
   
   B. INDUSTRY REPUTATION
      - Peer recognition and industry standing
      - Professional association memberships
      - Speaking engagements and thought leadership
      - Awards or recognition received
      - Industry committee or board positions

RESEARCH METHODOLOGY AND STANDARDS:

- Search across regulatory databases, court records, media archives, and official filings
- Cross-reference multiple independent sources for verification
- Focus on factual, verifiable information with specific dates, amounts, and references
- Exclude speculation, rumors, or unsubstantiated allegations
- Prioritize recent information (last 5 years) while including significant historical events
- Verify information through official government and regulatory sources

OUTPUT REQUIREMENTS:

For each finding, provide:
- Specific details: exact dates, monetary amounts, case numbers, regulatory references
- Source attribution with URLs or document references where possible
- Verification level: High (official records), Medium (credible media), Low (unverified)
- Business impact assessment: Critical, High, Medium, Low
- Current status: Active, Resolved, Under Investigation, Unknown
- Recommended follow-up actions if applicable

CRITICAL FOCUS AREAS:
- Any criminal convictions or ongoing criminal proceedings
- Regulatory disqualifications or sanctions
- Financial misconduct or fraud allegations
- Bankruptcy or insolvency involvement
- Significant litigation as defendant
- Conflicts of interest or governance failures
- Pattern of company failures during directorship tenure

Maintain professional standards and factual accuracy throughout the research. Do not speculate or make unfounded connections. If information is limited or unavailable, clearly state this rather than providing generic or irrelevant content.
`,
    search_parameters: {
        search_depth: 'exhaustive',

        entity_focus: context.directors?.map(d => d.name) || ['company_directors'],
        time_period_months: 120, // 10 years for comprehensive director analysis
        verification_required: true
    },
    expected_findings: [
        'director_background_verification',
        'regulatory_compliance_history',
        'legal_proceedings',
        'cross_directorship_analysis',
        'corporate_governance_issues',
        'reputation_analysis'
    ]
});

/**
 * Corporate Structure and Subsidiary Analysis Query Template
 * Analyzes subsidiaries, associates, joint ventures, and corporate relationships
 */
export const CORPORATE_STRUCTURE_QUERY = (context: EntityResearchContext): EntityResearchQuery => ({
    query_type: 'corporate_structure',
    query_template: `
COMPREHENSIVE CORPORATE STRUCTURE AND SUBSIDIARY ANALYSIS

TARGET ENTITY: ${context.company_name}
${context.cin ? `CIN: ${context.cin}` : ''}
${context.industry ? `INDUSTRY: ${context.industry}` : ''}

CORPORATE STRUCTURE RESEARCH SCOPE:

1. SUBSIDIARY COMPANIES ANALYSIS
   
   A. WHOLLY-OWNED SUBSIDIARIES (100% ownership)
      - Identify all direct wholly-owned subsidiaries
      - Step-down subsidiaries through multiple tiers
      - Overseas subsidiaries and international operations
      - Special purpose vehicles (SPVs) and holding structures
      - Recently acquired or divested subsidiaries
   
   B. MAJORITY-CONTROLLED SUBSIDIARIES (>50% ownership)
      - Companies with majority control but not full ownership
      - Voting control mechanisms and shareholder agreements
      - Board representation and management control
      - Minority shareholder rights and protections
      - Control premium and governance structures
   
   C. SIGNIFICANT MINORITY HOLDINGS (10-50% ownership)
      - Strategic investments and minority stakes
      - Board representation in investee companies
      - Influence over business decisions and strategy
      - Exit rights and liquidity provisions
      - Valuation and carrying amounts

2. ASSOCIATE COMPANIES AND STRATEGIC PARTNERSHIPS
   
   A. ASSOCIATE COMPANIES (20-50% ownership)
      - Joint control arrangements and governance
      - Shared management and operational integration
      - Financial performance and contribution to group
      - Strategic rationale and business synergies
      - Exit strategies and future plans
   
   B. JOINT VENTURES AND PARTNERSHIPS
      - Incorporated joint ventures and partnerships
      - Unincorporated joint arrangements
      - Consortium memberships and industry alliances
      - Technology partnerships and licensing agreements
      - Distribution partnerships and channel arrangements
   
   C. STRATEGIC ALLIANCES AND COLLABORATIONS
      - Research and development collaborations
      - Manufacturing and supply chain partnerships
      - Marketing and distribution alliances
      - Technology licensing and IP sharing
      - Industry consortium memberships

3. RELATED PARTY TRANSACTIONS AND RELATIONSHIPS
   
   A. SIGNIFICANT INTER-COMPANY TRANSACTIONS
      - Loans and advances between group entities
      - Guarantees and collateral arrangements
      - Management service agreements and shared services
      - Asset transfers and restructuring transactions
      - Pricing policies and transfer pricing arrangements
   
   B. KEY MANAGEMENT PERSONNEL RELATIONSHIPS
      - Transactions with directors and key management
      - Family member business interests and transactions
      - Personal guarantees and security arrangements
      - Compensation and benefit arrangements
      - Conflict of interest situations
   
   C. OTHER RELATED PARTY ARRANGEMENTS
      - Transactions with promoter group entities
      - Dealings with entities controlled by key personnel
      - Trust and foundation relationships
      - Charitable and CSR related transactions
      - Political contributions and lobbying activities

4. OWNERSHIP AND CONTROL ANALYSIS
   
   A. ULTIMATE BENEFICIAL OWNERSHIP STRUCTURE
      - Trace ownership to ultimate beneficial owners
      - Complex holding structures and layered ownership
      - Trust structures and nominee arrangements
      - Offshore entities and tax haven connections
      - Regulatory compliance with ownership disclosure
   
   B. VOTING CONTROL AND GOVERNANCE MECHANISMS
      - Voting agreements and control arrangements
      - Board composition and representation rights
      - Veto rights and protective provisions
      - Management control and operational oversight
      - Succession planning and leadership transition

ENTITY-SPECIFIC RESEARCH FOR EACH IDENTIFIED ENTITY:

For each subsidiary, associate, or related entity, research:

1. REGULATORY STATUS AND COMPLIANCE
   - Corporate registration and legal status
   - Regulatory licenses and approvals
   - Compliance with sector-specific regulations
   - Tax compliance and filing status
   - Environmental and safety compliance

2. FINANCIAL PERFORMANCE AND STABILITY
   - Recent financial performance and trends
   - Debt levels and financial leverage
   - Cash flow generation and liquidity
   - Profitability and return metrics
   - Credit ratings and external assessments

3. OPERATIONAL STATUS AND BUSINESS ACTIVITY
   - Current business operations and activity levels
   - Market position and competitive standing
   - Key customers and supplier relationships
   - Operational challenges or disruptions
   - Future business plans and strategy

4. LEGAL PROCEEDINGS AND DISPUTES
   - Ongoing litigation and legal disputes
   - Regulatory investigations or enforcement actions
   - Tax disputes and assessments
   - Labor disputes and employment issues
   - Intellectual property disputes

5. ADVERSE EVENTS AND RISK FACTORS
   - Business failures or operational disruptions
   - Management changes or governance issues
   - Adverse media coverage or reputational issues
   - Environmental incidents or safety violations
   - Cyber security breaches or data incidents

RISK ASSESSMENT FOCUS AREAS:

- Financial interdependencies and cross-guarantees
- Regulatory compliance across group entities
- Operational risks and business continuity
- Governance effectiveness and control systems
- Concentration risks and business dependencies
- Legal and regulatory exposure across jurisdictions

RESEARCH METHODOLOGY:
- Utilize corporate filings, annual reports, and regulatory submissions
- Cross-reference with MCA database and regulatory authority records
- Analyze related party transaction disclosures
- Review board resolutions and shareholder meeting minutes
- Examine audit reports and management discussions

OUTPUT REQUIREMENTS:
- Comprehensive corporate structure diagram with ownership percentages
- Detailed analysis of each significant entity
- Risk assessment for key relationships and transactions
- Regulatory compliance status across group entities
- Identification of potential conflicts or governance concerns
- Recommendations for further due diligence if required

Focus on factual information from official sources and regulatory filings. Clearly distinguish between direct evidence and inferred relationships. Highlight any gaps in available information or areas requiring additional investigation.
`,
    search_parameters: {
        search_depth: 'exhaustive',

        entity_focus: [
            context.company_name,
            ...(context.subsidiaries?.map(s => s.name) || []),
            ...(context.associates?.map(a => a.name) || [])
        ],
        time_period_months: 60, // 5 years for corporate structure analysis
        verification_required: true
    },
    expected_findings: [
        'subsidiary_analysis',
        'associate_company_analysis',
        'joint_venture_identification',
        'related_party_transactions',
        'ownership_structure_mapping',
        'corporate_governance_assessment'
    ]
});

/**
 * Related Parties and Joint Venture Analysis Query Template
 * Deep analysis of related party relationships and joint venture arrangements
 */
export const RELATED_PARTIES_QUERY = (context: EntityResearchContext): EntityResearchQuery => ({
    query_type: 'related_parties',
    query_template: `
COMPREHENSIVE RELATED PARTY AND JOINT VENTURE ANALYSIS

TARGET COMPANY: ${context.company_name}
${context.cin ? `CIN: ${context.cin}` : ''}

RELATED PARTY RESEARCH SCOPE:

1. PROMOTER GROUP AND CONTROLLING SHAREHOLDERS
   
   A. PROMOTER ENTITY ANALYSIS
      - Individual promoters and their business interests
      - Promoter group companies and their activities
      - Family members and their business involvement
      - Trust structures and beneficial ownership
      - Changes in promoter holdings and control
   
   B. PROMOTER GROUP TRANSACTIONS
      - Loans and advances to/from promoter entities
      - Asset purchases and sales with promoters
      - Guarantees and security arrangements
      - Management contracts and service agreements
      - Rent and lease arrangements with promoter entities
   
   C. PROMOTER COMPLIANCE AND GOVERNANCE
      - Pledging of shares and security arrangements
      - Related party transaction approvals and disclosures
      - Compliance with minimum public shareholding norms
      - Corporate governance violations or concerns
      - Regulatory actions against promoters

2. JOINT VENTURES AND STRATEGIC PARTNERSHIPS
   
   A. INCORPORATED JOINT VENTURES
      - Joint venture companies and their business activities
      - Shareholding patterns and control arrangements
      - Board representation and management structure
      - Financial performance and contribution to parent
      - Exit clauses and termination provisions
   
   B. UNINCORPORATED JOINT ARRANGEMENTS
      - Partnership agreements and collaboration arrangements
      - Profit sharing and cost allocation mechanisms
      - Operational control and management responsibilities
      - Intellectual property sharing and licensing
      - Dispute resolution mechanisms
   
   C. CONSORTIUM AND ALLIANCE ARRANGEMENTS
      - Industry consortium memberships
      - Bidding consortiums for projects or contracts
      - Technology alliances and R&D collaborations
      - Marketing and distribution partnerships
      - Supply chain and procurement alliances

3. KEY MANAGEMENT PERSONNEL RELATIONSHIPS
   
   A. DIRECTOR AND KMP BUSINESS INTERESTS
      - Other business interests of directors and KMPs
      - Family member business activities and interests
      - Potential conflicts of interest identification
      - Personal investments in related businesses
      - Outside board positions and advisory roles
   
   B. TRANSACTIONS WITH DIRECTORS AND KMPs
      - Compensation and remuneration arrangements
      - Loans and advances to directors and KMPs
      - Asset transactions and property dealings
      - Service contracts and consulting arrangements
      - Personal guarantees and security provisions
   
   C. FAMILY AND PERSONAL CONNECTIONS
      - Spouse and children business interests
      - Extended family business relationships
      - Personal asset transactions with company
      - Trust and estate planning arrangements
      - Charitable and foundation activities

4. BUSINESS ECOSYSTEM AND VALUE CHAIN ANALYSIS
   
   A. SUPPLIER AND VENDOR RELATIONSHIPS
      - Major suppliers and their relationship with company
      - Exclusive supply arrangements and dependencies
      - Related party suppliers and service providers
      - Pricing arrangements and commercial terms
      - Quality and performance issues
   
   B. CUSTOMER AND DISTRIBUTION RELATIONSHIPS
      - Major customers and their business relationships
      - Related party customers and revenue concentration
      - Distribution partners and channel arrangements
      - Exclusive dealing arrangements
      - Customer disputes and payment issues
   
   C. FINANCIAL INSTITUTION RELATIONSHIPS
      - Banking relationships and credit facilities
      - Related party financial institutions
      - Guarantee arrangements and security structures
      - Investment banking and advisory relationships
      - Insurance arrangements and risk management

TRANSACTION ANALYSIS AND RISK ASSESSMENT:

1. RELATED PARTY TRANSACTION EVALUATION
   - Transaction volumes and materiality assessment
   - Pricing analysis and arm's length evaluation
   - Board approval processes and governance
   - Audit committee oversight and recommendations
   - Shareholder approval requirements and compliance

2. BUSINESS RATIONALE AND COMMERCIAL JUSTIFICATION
   - Strategic rationale for related party arrangements
   - Commercial benefits and value creation
   - Alternative market options and benchmarking
   - Risk mitigation and business continuity benefits
   - Long-term sustainability and exit strategies

3. REGULATORY COMPLIANCE AND DISCLOSURE
   - Companies Act compliance for related party transactions
   - SEBI regulations and listing agreement compliance
   - Tax implications and transfer pricing compliance
   - Foreign exchange regulations and approvals
   - Sector-specific regulatory requirements

RISK IDENTIFICATION AND ASSESSMENT:

- Concentration risks from related party dependencies
- Governance risks from conflicts of interest
- Financial risks from guarantees and exposures
- Operational risks from exclusive arrangements
- Regulatory risks from compliance failures
- Reputational risks from adverse perceptions

RESEARCH METHODOLOGY:
- Analyze annual reports and related party disclosures
- Review board meeting minutes and resolutions
- Examine audit reports and management letters
- Cross-reference with regulatory filings and submissions
- Investigate media reports and industry intelligence

OUTPUT REQUIREMENTS:
- Comprehensive mapping of related party relationships
- Detailed analysis of significant transactions and arrangements
- Risk assessment for each major relationship
- Regulatory compliance evaluation
- Governance assessment and recommendations
- Red flags and areas of concern identification

Maintain objectivity and focus on factual analysis. Distinguish between legitimate business arrangements and potentially problematic relationships. Highlight any gaps in disclosure or transparency that may require further investigation.
`,
    search_parameters: {
        search_depth: 'exhaustive',

        entity_focus: [context.company_name, 'promoter_group', 'joint_ventures', 'related_parties'],
        time_period_months: 60,
        verification_required: true
    },
    expected_findings: [
        'promoter_group_analysis',
        'joint_venture_assessment',
        'related_party_transactions',
        'key_management_relationships',
        'business_ecosystem_mapping',
        'governance_risk_assessment'
    ]
});

/**
 * Cross-Directorship and Corporate Network Mapping Query Template
 * Maps director networks and identifies potential conflicts or governance concerns
 */
export const CROSS_DIRECTORSHIP_QUERY = (context: EntityResearchContext): EntityResearchQuery => ({
    query_type: 'cross_directorship',
    query_template: `
COMPREHENSIVE CROSS-DIRECTORSHIP AND CORPORATE NETWORK ANALYSIS

TARGET COMPANY: ${context.company_name}
DIRECTORS TO ANALYZE: ${context.directors?.map(d => d.name).join(', ') || 'All company directors'}

CROSS-DIRECTORSHIP RESEARCH SCOPE:

1. INDIVIDUAL DIRECTOR NETWORK MAPPING
   
   For each director, identify and analyze:
   
   A. CURRENT BOARD POSITIONS
      - All current directorships in public companies
      - Private company board positions and roles
      - Subsidiary and associate company directorships
      - Non-profit and charitable organization boards
      - Government and regulatory body appointments
   
   B. HISTORICAL DIRECTORSHIP PATTERN ANALYSIS
      - Directorship history over past 10 years
      - Pattern of appointments and resignations
      - Companies that failed during director tenure
      - Resignations under adverse circumstances
      - Career progression and board advancement
   
   C. BOARD COMMITTEE MEMBERSHIPS
      - Audit committee positions and chairmanships
      - Remuneration committee memberships
      - Risk management committee roles
      - Nomination committee positions
      - Other specialized committee appointments

2. CORPORATE NETWORK INTERCONNECTIONS
   
   A. DIRECTOR OVERLAP ANALYSIS
      - Common directors across multiple companies
      - Board interlocks and network connections
      - Industry clustering and sector concentration
      - Geographic concentration of directorships
      - Size and complexity of director networks
   
   B. BUSINESS RELATIONSHIP MAPPING
      - Companies with business relationships and common directors
      - Supplier-customer relationships with director overlaps
      - Joint venture partners with shared directors
      - Competitor companies with common board members
      - Financial institution relationships and director connections
   
   C. OWNERSHIP AND CONTROL CONNECTIONS
      - Directors with ownership stakes in multiple companies
      - Promoter group directors across group entities
      - Family business networks and director appointments
      - Trust and holding company director arrangements
      - Cross-shareholding patterns with director involvement

3. CONFLICT OF INTEREST IDENTIFICATION
   
   A. COMPETING BUSINESS INTERESTS
      - Directors serving on boards of competing companies
      - Potential conflicts in strategic decision making
      - Information sharing concerns and confidentiality
      - Market competition and antitrust implications
      - Customer and supplier relationship conflicts
   
   B. RELATED PARTY TRANSACTION CONFLICTS
      - Directors approving transactions with their other companies
      - Self-dealing and personal benefit situations
      - Family member business interest conflicts
      - Inadequate recusal from conflicted decisions
      - Governance failures in conflict management
   
   C. REGULATORY AND COMPLIANCE CONFLICTS
      - Directors in regulated industries with overlapping roles
      - Potential regulatory approval conflicts
      - Licensing and permit application conflicts
      - Government contract bidding conflicts
      - Industry association and policy influence conflicts

4. GOVERNANCE EFFECTIVENESS ASSESSMENT
   
   A. BOARD INDEPENDENCE EVALUATION
      - Independent director classifications and reality
      - Length of tenure and independence erosion
      - Financial relationships affecting independence
      - Family and personal relationships with management
      - Professional service relationships and dependencies
   
   B. BOARD EFFECTIVENESS AND PERFORMANCE
      - Director attendance and participation levels
      - Board meeting frequency and engagement
      - Committee effectiveness and oversight quality
      - Strategic guidance and value addition
      - Risk oversight and compliance monitoring
   
   C. SUCCESSION PLANNING AND RENEWAL
      - Board composition and skill diversity
      - Age and tenure distribution analysis
      - Succession planning and director pipeline
      - Board evaluation and performance assessment
      - Director development and training programs

5. NETWORK RISK ASSESSMENT
   
   A. SYSTEMIC RISK IDENTIFICATION
      - Concentration of directors across key industries
      - Network vulnerability to individual director issues
      - Reputational contagion risks across network
      - Regulatory action spillover effects
      - Market confidence and investor perception risks
   
   B. GOVERNANCE RISK EVALUATION
      - Weak governance practices across director network
      - Inadequate oversight and control systems
      - Poor risk management and compliance culture
      - Ineffective board processes and procedures
      - Lack of accountability and transparency
   
   C. OPERATIONAL RISK ASSESSMENT
      - Business continuity risks from director dependencies
      - Knowledge and expertise concentration risks
      - Succession planning inadequacies
      - Strategic decision making bottlenecks
      - Stakeholder relationship management risks

SPECIFIC RESEARCH AREAS:

1. REGULATORY COMPLIANCE ACROSS NETWORK
   - Companies Act compliance for multiple directorships
   - SEBI regulations and listing agreement adherence
   - Sector-specific regulatory compliance
   - Foreign investment and FEMA compliance
   - Tax compliance and reporting obligations

2. FINANCIAL PERFORMANCE CORRELATION
   - Performance patterns across director's portfolio companies
   - Financial distress correlation and contagion
   - Credit rating impacts and downgrades
   - Market performance and valuation effects
   - Investor confidence and market perception

3. LITIGATION AND LEGAL EXPOSURE
   - Legal proceedings involving multiple companies
   - Director liability and personal exposure
   - Class action suits and shareholder litigation
   - Regulatory enforcement actions
   - Criminal proceedings and investigations

RESEARCH METHODOLOGY:
- Utilize MCA database for directorship information
- Cross-reference with stock exchange filings
- Analyze annual reports and board composition disclosures
- Review regulatory submissions and compliance reports
- Examine media reports and industry intelligence
- Map relationships using network analysis techniques

OUTPUT REQUIREMENTS:
- Visual network map of director interconnections
- Detailed analysis of each director's portfolio
- Conflict of interest identification and assessment
- Governance effectiveness evaluation
- Risk assessment for network relationships
- Recommendations for governance improvements
- Red flags and areas requiring immediate attention

Focus on factual information from official sources. Clearly distinguish between potential conflicts and actual governance failures. Provide specific examples and evidence for all identified concerns. Maintain professional standards and avoid speculation about director motivations or intentions.
`,
    search_parameters: {
        search_depth: 'exhaustive',

        entity_focus: context.directors?.map(d => d.name) || ['company_directors'],
        time_period_months: 120, // 10 years for comprehensive network analysis
        verification_required: true
    },
    expected_findings: [
        'director_network_mapping',
        'cross_directorship_analysis',
        'conflict_identification',
        'governance_assessment',
        'network_risk_evaluation',
        'compliance_analysis'
    ]
});

/**
 * Generate comprehensive entity research queries based on context
 */
export class EntityResearchQueryGenerator {
    /**
     * Generate all comprehensive entity research queries for a company
     */
    static generateAllQueries(context: EntityResearchContext): EntityResearchQuery[] {
        return [
            DIRECTORS_COMPREHENSIVE_QUERY(context),
            CORPORATE_STRUCTURE_QUERY(context),
            RELATED_PARTIES_QUERY(context),
            CROSS_DIRECTORSHIP_QUERY(context)
        ];
    }

    /**
     * Generate specific query by type
     */
    static generateQuery(
        queryType: 'directors_comprehensive' | 'corporate_structure' | 'related_parties' | 'cross_directorship',
        context: EntityResearchContext
    ): EntityResearchQuery {
        switch (queryType) {
            case 'directors_comprehensive':
                return DIRECTORS_COMPREHENSIVE_QUERY(context);
            case 'corporate_structure':
                return CORPORATE_STRUCTURE_QUERY(context);
            case 'related_parties':
                return RELATED_PARTIES_QUERY(context);
            case 'cross_directorship':
                return CROSS_DIRECTORSHIP_QUERY(context);
            default:
                throw new Error(`Unknown query type: ${queryType}`);
        }
    }

    /**
     * Extract entity context from company data
     */
    static extractEntityContext(companyData: any): EntityResearchContext {
        const extractedData = companyData?.extracted_data || companyData;
        const aboutCompany = companyData['About the Company']
        const registeredAddress = aboutCompany?.addresses?.business_address
        const companyInfo = aboutCompany?.company_info

        return {
            company_name: companyInfo.legal_name,
            cin: companyInfo?.cin,
            pan: companyInfo?.pan,
            industry: registeredAddress?.segment,
            directors: this.extractDirectorInfo(extractedData),
            subsidiaries: this.extractSubsidiaryInfo(extractedData),
            associates: this.extractAssociateInfo(extractedData)
        };
    }

    /**
     * Extract director information from company data
     */
    private static extractDirectorInfo(data: any): DirectorInfo[] {
        const directors = data['Directors']
        const isActiveDirector = (director: any) => {
            return !director.date_of_cessation || director.date_of_cessation === '' || director.date_of_cessation === '-'
        }

        const activeDirectors = directors?.data?.filter(isActiveDirector).map(director => ({
            name: director.name || director.directorName || 'Unknown',
            designation: director.present_designation || director.position || 'Director',
            din: director.din || director.DIN,
            pan: director.pan || director.PAN,
            appointment_date: director.present_designation_appointment_date || director.appointment_date
        }))

        return activeDirectors;
    }

    /**
     * Extract subsidiary information from company data
     */
    private static extractSubsidiaryInfo(data: any): SubsidiaryInfo[] {
        const subsidiaries: SubsidiaryInfo[] = [];

        const subsidiarySources = [
            data?.subsidiaries,
            data?.subsidiaryCompanies,
            data?.groupCompanies
        ].filter(Boolean);

        for (const source of subsidiarySources) {
            if (Array.isArray(source)) {
                for (const subsidiary of source) {
                    if (typeof subsidiary === 'string') {
                        subsidiaries.push({
                            name: subsidiary,
                            relationship_type: 'Subsidiary'
                        });
                    } else if (typeof subsidiary === 'object') {
                        subsidiaries.push({
                            name: subsidiary.name || subsidiary.companyName || 'Unknown',
                            cin: subsidiary.cin || subsidiary.CIN,
                            ownership_percentage: subsidiary.ownershipPercentage || subsidiary.shareholding,
                            relationship_type: subsidiary.relationshipType || 'Subsidiary'
                        });
                    }
                }
            }
        }

        return subsidiaries;
    }

    /**
     * Extract associate company information from company data
     */
    private static extractAssociateInfo(data: any): AssociateInfo[] {
        const associates: AssociateInfo[] = [];

        const associateSources = [
            data?.associates,
            data?.associateCompanies,
            data?.jointVentures,
            data?.partnerships
        ].filter(Boolean);

        for (const source of associateSources) {
            if (Array.isArray(source)) {
                for (const associate of source) {
                    if (typeof associate === 'string') {
                        associates.push({
                            name: associate,
                            relationship_type: 'Associate'
                        });
                    } else if (typeof associate === 'object') {
                        associates.push({
                            name: associate.name || associate.companyName || 'Unknown',
                            cin: associate.cin || associate.CIN,
                            relationship_type: associate.relationshipType || 'Associate',
                            business_relationship: associate.businessRelationship || associate.relationship
                        });
                    }
                }
            }
        }

        return associates;
    }
}

/**
 * Entity Research Query Execution Parameters
 */
export interface EntityQueryExecutionParams {
    query: EntityResearchQuery;
    context: EntityResearchContext;
    iteration_number?: number;
    focus_refinement?: string[];
    verification_level?: 'standard' | 'enhanced' | 'exhaustive';
}

/**
 * Enhanced query parameters for specific research focus
 */
export const ENTITY_RESEARCH_FOCUS_AREAS = {
    directors_comprehensive: [
        'criminal_background',
        'regulatory_sanctions',
        'financial_misconduct',
        'cross_directorships',
        'governance_failures',
        'reputation_analysis'
    ],
    corporate_structure: [
        'subsidiary_analysis',
        'ownership_mapping',
        'related_party_transactions',
        'joint_ventures',
        'corporate_governance',
        'regulatory_compliance'
    ],
    related_parties: [
        'promoter_relationships',
        'transaction_analysis',
        'conflict_identification',
        'governance_assessment',
        'compliance_evaluation',
        'risk_assessment'
    ],
    cross_directorship: [
        'network_mapping',
        'conflict_analysis',
        'governance_effectiveness',
        'independence_assessment',
        'systemic_risks',
        'compliance_monitoring'
    ]
} as const;