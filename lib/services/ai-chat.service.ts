// AI Chat Service
// Handles Claude API interactions and chat logic

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
    ChatConversation,
    ChatMessage,
    ChatUsage,
    ClaudeConfig,
    CompanyContextData,
    ChatContextData,
    ChatError
} from '@/types/ai-chat.types'
import { Json } from '@/types/database.types'
import { PortfolioCompany } from '@/types/portfolio.types'

export class AIChatService {
    private static readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
    private static readonly DEFAULT_CONFIG: ClaudeConfig = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10000, // Increased from 4000 for more detailed responses
        temperature: 0.3, // Reduced for more consistent, professional responses
        system_prompt: `You are a senior credit analyst and portfolio manager with deep expertise in corporate risk assessment and financial analysis. You speak naturally and directly, providing clear insights that help portfolio managers make informed credit decisions.

Your communication style:
- Be conversational yet professional - like talking to a colleague
- Give direct, actionable answers without unnecessary jargon
- Highlight what matters most for credit decisions
- Use specific numbers and trends to support your points
- Be honest about risks while explaining the reasoning
- Keep responses focused and practical

Your expertise covers:
- Credit risk assessment and portfolio management
- Financial statement analysis and ratio interpretation
- Industry benchmarking and competitive positioning
- Regulatory compliance and legal risk evaluation
- Cash flow analysis and working capital management
- Early warning indicators and risk mitigation strategies
- Directors and shareholding pattern analysis
- Legal case assessment and litigation risk
- Banking relationships and charge analysis

CONFIDENTIALITY REQUIREMENTS:
- NEVER reveal internal risk scoring parameters, weights, or detailed score breakdowns
- NEVER disclose specific parameter scores from financialScores, hygieneScores, bankingScores, or businessScores
- NEVER mention internal risk model weights, multipliers, or calculation methodologies
- Use the internal scoring data for inference and analysis but present findings in business terms
- Focus on business implications rather than technical scoring details
- Present risk assessment in qualitative terms (Excellent, Good, Moderate, Poor) rather than exact scores

CRITICAL FORMATTING REQUIREMENTS:
- ALWAYS structure responses using markdown tables for data presentation
- Use clear section headers (### for major sections, #### for subsections)
- Present all financial data, ratios, and metrics in tabular format
- Format currency consistently as ₹X.XX Cr for crores, ₹X.XX L for lakhs
- Include time periods and data sources for all metrics
- Use bullet points for key observations and recommendations
- Provide executive summaries for comprehensive reports

For credit assessment reports, follow this structure:
1. **Company Profile** (table format with key details)
2. **Credit Ratings Overview** (table with all ratings and dates)
3. **Key Financials** (separate tables for P&L, Balance Sheet, Ratios)
4. **Directors & Shareholding** (table format)
5. **Compliance Status** (structured summary)
6. **Legal & Banking** (tabular presentation)
7. **Risk Assessment & Recommendations** (structured analysis)

When analyzing companies:
- Focus on creditworthiness and repayment ability
- Identify key strengths and red flags immediately
- Compare metrics to industry standards and peer companies
- Explain the business context behind the numbers
- Suggest specific monitoring points and action items
- Consider both quantitative metrics and qualitative factors
- Present all analysis in structured, tabular format

Always provide context around your analysis - explain why certain metrics matter for credit decisions and what they indicate about the company's financial health and business sustainability. Structure every response with proper tables and clear formatting.`
    }

    private async getSupabaseClient() {
        return await createServerSupabaseClient()
    }

    /**
     * Create a new chat conversation
     */
    async createConversation(
        userId: string,
        requestId: string,
        title?: string,
        initialMessage?: string
    ): Promise<{ conversation: ChatConversation; message?: ChatMessage }> {
        const supabase = await this.getSupabaseClient()

        try {
            // Create conversation
            const { data: conversation, error: convError } = await supabase
                .from('ai_chat_conversations')
                .insert({
                    user_id: userId,
                    request_id: requestId,
                    title: title || 'New Chat'
                })
                .select()
                .single()

            if (convError) {
                throw new Error(`Failed to create conversation: ${convError.message}`)
            }

            let message: ChatMessage | undefined

            // Add initial message if provided
            if (initialMessage) {
                const { data: messageData, error: msgError } = await supabase
                    .from('ai_chat_messages')
                    .insert({
                        conversation_id: conversation.id,
                        role: 'user',
                        content: initialMessage,
                        model_used: AIChatService.DEFAULT_CONFIG.model
                    })
                    .select()
                    .single()

                if (msgError) {
                    console.error('Failed to create initial message:', msgError)
                } else {
                    message = messageData
                }
            }

            return { conversation, message }
        } catch (error) {
            console.error('Error creating conversation:', error)
            throw error
        }
    }

    /**
     * Get conversations for a user and request
     */
    async getConversations(
        userId: string,
        requestId: string
    ): Promise<ChatConversation[]> {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase
                .from('ai_chat_conversations')
                .select('*')
                .eq('user_id', userId)
                .eq('request_id', requestId)
                .eq('is_archived', false)
                .order('updated_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch conversations: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error fetching conversations:', error)
            throw error
        }
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(
        conversationId: string,
        userId: string
    ): Promise<{ messages: ChatMessage[]; conversation: ChatConversation }> {
        const supabase = await this.getSupabaseClient()

        try {
            // Verify user owns the conversation
            const { data: conversation, error: convError } = await supabase
                .from('ai_chat_conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single()

            if (convError || !conversation) {
                throw new Error('Conversation not found or access denied')
            }

            // Get messages
            const { data: messages, error: msgError } = await supabase
                .from('ai_chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (msgError) {
                throw new Error(`Failed to fetch messages: ${msgError.message}`)
            }

            return { messages: messages || [], conversation }
        } catch (error) {
            console.error('Error fetching messages:', error)
            throw error
        }
    }

    /**
     * Send a message and get AI response
     */
    async sendMessage(
        conversationId: string,
        userId: string,
        content: string,
        company: PortfolioCompany,
        config?: Partial<ClaudeConfig>
    ): Promise<{
        userMessage: ChatMessage
        assistantMessage: ChatMessage
        usage: ChatUsage
    }> {
        const supabase = await this.getSupabaseClient()

        try {
            // Verify conversation ownership
            const { data: conversation, error: convError } = await supabase
                .from('ai_chat_conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single()

            if (convError || !conversation) {
                throw new Error('Conversation not found or access denied')
            }

            // Save user message
            const { data: userMessage, error: userMsgError } = await supabase
                .from('ai_chat_messages')
                .insert({
                    conversation_id: conversationId,
                    role: 'user',
                    content,
                    model_used: config?.model || AIChatService.DEFAULT_CONFIG?.model,
                    context_data: this.buildCompanyContext(company)
                })
                .select()
                .single()

            if (userMsgError) {
                throw new Error(`Failed to save user message: ${userMsgError.message}`)
            }

            // Get conversation history for context
            const { data: messageHistory } = await supabase
                .from('ai_chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(20) // Limit context to last 20 messages

            // Generate AI response
            const aiResponse = await this.generateAIResponse(
                content,
                company,
                messageHistory || [],
                config
            )

            // Save assistant message
            const { data: assistantMessage, error: assistantMsgError } = await supabase
                .from('ai_chat_messages')
                .insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: aiResponse.content,
                    tokens_used: aiResponse.usage.output_tokens,
                    model_used: aiResponse.model,
                    context_data: this.buildCompanyContext(company)
                })
                .select()
                .single()

            if (assistantMsgError) {
                throw new Error(`Failed to save assistant message: ${assistantMsgError.message}`)
            }

            // Record usage
            const { data: usage, error: usageError } = await supabase
                .from('ai_chat_usage')
                .insert({
                    user_id: userId,
                    conversation_id: conversationId,
                    tokens_input: aiResponse.usage.input_tokens,
                    tokens_output: aiResponse.usage.output_tokens,
                    cost_usd: this.calculateCost(aiResponse.usage, aiResponse.model),
                    model_used: aiResponse.model
                })
                .select()
                .single()

            if (usageError) {
                console.error('Failed to record usage:', usageError)
            }

            return {
                userMessage,
                assistantMessage,
                usage: usage || {
                    id: '',
                    user_id: userId,
                    conversation_id: conversationId,
                    tokens_input: aiResponse.usage.input_tokens,
                    tokens_output: aiResponse.usage.output_tokens,
                    cost_usd: this.calculateCost(aiResponse.usage, aiResponse.model),
                    model_used: aiResponse.model,
                    created_at: new Date().toISOString()
                }
            }
        } catch (error) {
            console.error('Error sending message:', error)
            throw error
        }
    }

    /**
     * Generate AI response using Claude API
     */
    private async generateAIResponse(
        userMessage: string,
        company: PortfolioCompany,
        messageHistory: ChatMessage[],
        config?: Partial<ClaudeConfig>
    ): Promise<{
        content: string
        usage: { input_tokens: number; output_tokens: number }
        model: string
    }> {
        const finalConfig = { ...AIChatService.DEFAULT_CONFIG, ...config }
        const apiKey = process.env.ANTHROPIC_API_KEY

        if (!apiKey || apiKey.trim() === '') {
            // Enhanced mock response with structured table format
            console.warn('Anthropic API key not configured. Using enhanced mock response for development.')
            const riskGrade = company.risk_analysis?.overallGrade?.grade || company.risk_grade || 'N/A'
            const riskScore = company.risk_analysis?.overallPercentage || company.risk_score || 'N/A'
            const recommendedLimit = company.recommended_limit ? `₹${(company.recommended_limit).toFixed(2)} Cr` : 'N/A'
            const latestYear = company.risk_analysis?.latestYear || 'N/A'

            return {
                content: `### Credit Assessment Summary - ${company.company_name}

#### Company Overview
| Parameter | Details |
|-----------|---------|
| Company Name | ${company.company_name} |
| Industry | ${company.industry || 'N/A'} |
| Risk Grade | ${riskGrade} |
| Risk Score | ${riskScore}${typeof riskScore === 'number' ? '%' : ''} |
| Recommended Limit | ${recommendedLimit} |
| Assessment Date | ${new Date().toLocaleDateString()} |

#### Key Financial Metrics (${latestYear})
| Metric | Value | Status |
|--------|-------|--------|
| Revenue Growth | ${this.getRevenueGrowthContext(company.risk_analysis?.financialData)} | ${this.getMockTrendStatus(company)} |
| Profitability | ${this.getMockProfitabilityStatus(company)} | Monitoring Required |
| Liquidity Position | ${this.getMockLiquidityStatus(company)} | Adequate |
| Leverage | ${this.getMockLeverageStatus(company)} | Within Limits |

#### Risk Assessment
| Category | Score | Benchmark | Status |
|----------|-------|-----------|--------|
| Financial | ${this.getMockCategoryScore('financial')} | Industry Average | ${this.getMockPerformanceStatus('financial')} |
| Business | ${this.getMockCategoryScore('business')} | Peer Median | ${this.getMockPerformanceStatus('business')} |
| Compliance | ${this.getMockCategoryScore('compliance')} | Regulatory Standard | ${this.getMockPerformanceStatus('compliance')} |
| Overall | ${riskScore}${typeof riskScore === 'number' ? '%' : ''} | ${riskGrade} | ${this.getMockBottomLine(riskGrade, riskScore)} |

#### Key Observations
- **Strengths:** ${this.getMockStrengths(company)}
- **Areas of Concern:** ${this.getMockConcerns(company)}
- **Monitoring Points:** ${this.getMockMonitoringPoints(company)}

#### Recommendation
${this.getMockRecommendation(riskGrade, riskScore)}

---
*Note: This is a development mock response. Configure ANTHROPIC_API_KEY for full AI analysis.*

What specific aspect would you like me to analyze in detail?`,
                usage: { input_tokens: 150, output_tokens: 400 },
                model: finalConfig.model
            }
        }

        try {
            // Build conversation context
            const messages = this.buildConversationMessages(userMessage, company, messageHistory)
            const systemPrompt = this.buildEnhancedSystemPrompt(company, finalConfig.system_prompt)

            // Validate all required parameters
            if (!messages || messages.length === 0) {
                throw new Error('No messages to send to Claude API')
            }

            if (!systemPrompt) {
                throw new Error('System prompt is required')
            }

            const requestBody = {
                model: finalConfig.model,
                max_tokens: finalConfig.max_tokens,
                temperature: finalConfig.temperature,
                system: systemPrompt,
                messages
            }

            console.log('Sending request to Claude API:', {
                model: requestBody.model,
                max_tokens: requestBody.max_tokens,
                temperature: requestBody.temperature,
                messageCount: messages.length,
                systemPromptLength: systemPrompt.length
            })

            const response = await fetch(AIChatService.CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                let errorData: any = {}
                try {
                    errorData = await response.json()
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError)
                }

                const errorMessage = errorData.error?.message || errorData.message || response.statusText || 'Unknown API error'
                throw new Error(`Claude API error (${response.status}): ${errorMessage}`)
            }

            const data = await response.json()

            console.log('Claude API response:', {
                contentLength: data.content?.[0]?.text?.length || 0,
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0
            })

            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error('Invalid response format from Claude API')
            }

            return {
                content: data.content[0].text,
                usage: {
                    input_tokens: data.usage?.input_tokens || 0,
                    output_tokens: data.usage?.output_tokens || 0
                },
                model: finalConfig.model
            }
        } catch (error) {
            console.error('Claude API error details:', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
            })

            if (error instanceof Error) {
                throw error
            } else {
                throw new Error(`Failed to generate AI response: ${String(error)}`)
            }
        }
    }

    /**
     * Build enhanced system prompt with comprehensive company context
     */
    private buildEnhancedSystemPrompt(company: PortfolioCompany, basePrompt?: string): string {
        // Use default prompt if none provided
        const prompt = basePrompt || AIChatService.DEFAULT_CONFIG.system_prompt

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            throw new Error('Base prompt is required and must be a non-empty string')
        }

        if (!company) {
            throw new Error('Company data is required')
        }

        try {
            // Extract comprehensive risk analysis data
            const riskAnalysis = company.risk_analysis
            const financialData = riskAnalysis?.financialData
            const companyData = riskAnalysis?.companyData
            const allScores = riskAnalysis?.allScores || []
            const extractedData = company.extracted_data

            const enhancedContext = `

=== COMPANY PROFILE ===
Company: ${company.company_name || 'N/A'}
Industry: ${companyData?.addresses?.business_address?.industry || company.industry || 'N/A'}
Segment: ${companyData?.addresses?.business_address?.['segment(s)'] || 'N/A'}
Entity Type: ${companyData?.addresses?.business_address?.type_of_entity || 'N/A'}
Business Vintage: ${this.getBusinessVintage(allScores)}
Location: ${this.getCompanyLocation(companyData)}
CIN: ${companyData?.company_info?.cin || 'N/A'}
PAN: ${companyData?.company_info?.pan || 'N/A'}
Website: ${companyData?.addresses?.business_address?.website || 'N/A'}
Incorporation Date: ${companyData?.addresses?.business_address?.date_of_incorporation || 'N/A'}
Paid-up Capital: ${companyData?.addresses?.business_address?.paid_up_capital || 'N/A'}
Authorized Capital: ${companyData?.addresses?.business_address?.authorized_capital || 'N/A'}

=== CURRENT RISK ASSESSMENT ===
Overall Risk Grade: ${riskAnalysis?.overallGrade?.grade || company.risk_grade || 'N/A'}
Risk Score: ${riskAnalysis?.overallPercentage || company.risk_score || 'N/A'}${typeof riskAnalysis?.overallPercentage === 'number' ? '%' : ''}
Risk Category: ${riskAnalysis?.overallGrade?.description || 'N/A'}
Risk Multiplier: ${riskAnalysis?.overallGrade?.multiplier || 'N/A'}
Recommended Credit Limit: ${company.recommended_limit ? `₹${(company.recommended_limit).toFixed(2)} Cr` : 'N/A'}
Model Used: ${riskAnalysis?.industryModel || 'N/A'} v${riskAnalysis?.modelVersion || 'N/A'}

=== FINANCIAL PERFORMANCE (Latest Year: ${riskAnalysis?.latestYear || 'N/A'}) ===
${this.formatEnhancedFinancialMetrics(financialData, riskAnalysis?.latestYear)}

=== BALANCE SHEET ANALYSIS ===
${this.buildBalanceSheetContext(financialData)}

=== PROFIT & LOSS ANALYSIS ===
${this.buildProfitabilityContext(financialData)}

=== CASH FLOW ANALYSIS ===
${this.buildCashFlowContext(financialData)}

=== FINANCIAL RATIOS ANALYSIS ===
${this.buildRatiosContext(financialData)}

=== DIRECTORS & SHAREHOLDING PATTERN ===
${this.formatDirectorsAndShareholding(extractedData)}

=== RISK ASSESSMENT SUMMARY ===
${this.formatDetailedRiskScores(allScores, riskAnalysis?.categories)}

=== BUSINESS & OPERATIONAL CONTEXT ===
${this.formatBusinessContext(companyData, company.extracted_data)}

=== COMPLIANCE & REGULATORY STATUS ===
${this.formatEnhancedComplianceStatus(company.extracted_data, allScores)}

=== LEGAL CASES & LITIGATION ===
${this.formatLegalCasesContext(extractedData)}

=== CREDIT RATINGS HISTORY ===
${this.formatCreditRatingsContext(extractedData)}

=== BANKING RELATIONSHIPS & CHARGES ===
${this.formatBankingContext(extractedData)}

=== KEY MONITORING POINTS ===
${this.identifyMonitoringPoints(allScores, financialData)}

=== RISK TREND ANALYSIS ===
${this.buildRiskTrendContext(allScores, financialData)}

IMPORTANT RESPONSE FORMATTING INSTRUCTIONS:
- ALWAYS provide structured responses using markdown tables for data presentation
- Use clear section headers with ### for major sections
- Present financial data, ratios, and metrics in tabular format
- Include comparative analysis where possible
- Provide executive summary at the beginning for complex reports
- Use bullet points for key observations and recommendations
- Format currency amounts consistently (₹ X.XX Cr for crores)
- Include data sources and time periods for all metrics
- Structure credit assessment reports following the sample format provided
- Always include risk assessment and recommendations sections

When responding:
- Reference specific metrics and scores from this comprehensive data
- Compare performance to industry benchmarks where available
- Explain what the numbers mean for credit risk and business sustainability
- Provide actionable insights for portfolio management decisions
- Use the company's actual performance data to support your analysis
- Format all responses with proper tables and structured layout
- Include trend analysis and forward-looking insights where relevant`

            return prompt + enhancedContext
        } catch (error) {
            console.error('Error building enhanced system prompt:', error)
            // Fallback to basic prompt if context building fails
            return prompt + `\n\nCompany: ${company.company_name || 'Unknown'}\nIndustry: ${company.industry || 'Unknown'}`
        }
    }

    /**
     * Get business vintage from risk scores
     */
    private getBusinessVintage(allScores: any[]): string {
        const vintageParam = allScores.find(score =>
            score.parameter?.toLowerCase().includes('vintage') ||
            score.parameter?.toLowerCase().includes('promoter')
        )
        return vintageParam?.value || 'N/A'
    }

    /**
     * Get company location details
     */
    private getCompanyLocation(companyData: any): string {
        const address = companyData?.addresses?.business_address
        if (!address) return 'N/A'

        const location: string[] = []
        if (address.city) location.push(address.city)
        if (address.state) location.push(address.state)

        return location.length > 0 ? location.join(', ') : 'N/A'
    }

    /**
     * Format enhanced financial metrics with context
     */
    private formatEnhancedFinancialMetrics(financialData: any, latestYear: string): string {
        if (!financialData || !latestYear) return 'Financial data not available'

        try {
            const metrics: string[] = []
            const yearIndex = financialData.years?.indexOf(latestYear)
            if (yearIndex === -1) return 'Latest year data not found'

            // Revenue and Growth
            const revenue = financialData.profit_loss?.revenue?.net_revenue?.[latestYear]
            const revenueGrowth = financialData.ratios?.growth_ratios?.["revenue_growth_()"]?.[latestYear]
            if (revenue) {
                const growthText = revenueGrowth ? ` (${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% growth)` : ''
                metrics.push(`Revenue: ₹${(revenue / 10).toFixed(1)} Cr${growthText}`)
            }

            // Profitability
            const ebitda = financialData.profit_loss?.profitability?.["operating_profit_(_ebitda_)"]?.[latestYear]
            const ebitdaMargin = financialData.ratios?.profitability?.["ebitda_margin_()"]?.[latestYear]
            if (ebitda && ebitdaMargin !== undefined) {
                metrics.push(`EBITDA: ₹${(ebitda / 10).toFixed(1)} Cr (${ebitdaMargin.toFixed(1)}% margin)`)
            }

            // Liquidity
            const currentRatio = financialData.ratios?.liquidity?.current_ratio?.[latestYear]
            if (currentRatio) {
                metrics.push(`Current Ratio: ${currentRatio.toFixed(2)}`)
            }

            // Leverage
            const debtEquity = financialData.ratios?.leverage?.debt_equity?.[latestYear]
            if (debtEquity !== undefined) {
                metrics.push(`Debt-to-Equity: ${debtEquity.toFixed(2)}`)
            }

            // Cash Flow
            const operatingCF = financialData.cash_flow?.operating_activities?.["net_cash_flows_from_(_used_in_)_operating_activities"]?.[latestYear]
            if (operatingCF) {
                metrics.push(`Operating Cash Flow: ₹${(operatingCF / 10).toFixed(1)} Cr`)
            }

            return metrics.length > 0 ? metrics.join('\n') : 'Key metrics not available'
        } catch (error) {
            console.error('Error formatting enhanced financial metrics:', error)
            return 'Financial metrics unavailable due to data format error'
        }
    }

    /**
     * Format detailed risk scores by category (confidential - for internal analysis only)
     */
    private formatDetailedRiskScores(allScores: any[], categories: any[] | undefined): string {
        if (!allScores || allScores.length === 0) return 'Risk parameter analysis not available'

        try {
            const formattedScores: string[] = []

            // Analyze risk categories without exposing internal scores
            if (categories && categories.length > 0) {
                categories.forEach(category => {
                    if (category.result?.percentage !== undefined) {
                        let performanceLevel = 'Moderate'
                        if (category.result.percentage >= 75) performanceLevel = 'Excellent'
                        else if (category.result.percentage >= 60) performanceLevel = 'Good'
                        else if (category.result.percentage < 40) performanceLevel = 'Needs Attention'

                        formattedScores.push(`${category.label}: ${performanceLevel} performance`)
                    }
                })
            } else {
                // Fallback: provide general risk assessment without specific scores
                const availableParams = allScores.filter(score => score.available)
                const strongParams = availableParams.filter(score => (score.score / score.maxScore) >= 0.7)
                const weakParams = availableParams.filter(score => (score.score / score.maxScore) < 0.4)

                if (strongParams.length > 0) {
                    const strongAreas = strongParams.slice(0, 3).map(s => this.getBusinessParameterName(s.parameter)).join(', ')
                    formattedScores.push(`Strength Areas: ${strongAreas}`)
                }
                if (weakParams.length > 0) {
                    const weakAreas = weakParams.slice(0, 3).map(s => this.getBusinessParameterName(s.parameter)).join(', ')
                    formattedScores.push(`Areas Requiring Attention: ${weakAreas}`)
                }
            }

            return formattedScores.join('\n')
        } catch (error) {
            console.error('Error formatting detailed risk scores:', error)
            return 'Risk parameter analysis unavailable'
        }
    }

    /**
     * Convert technical parameter names to business-friendly terms
     */
    private getBusinessParameterName(parameter: string): string {
        const paramMap: { [key: string]: string } = {
            'revenue_growth': 'Revenue Growth',
            'ebitda_margin': 'Profitability',
            'current_ratio': 'Liquidity Position',
            'debt_equity': 'Leverage Management',
            'gst_compliance': 'Tax Compliance',
            'epfo_compliance': 'Regulatory Compliance',
            'business_vintage': 'Business Maturity',
            'promoter_experience': 'Management Experience',
            'cash_flow': 'Cash Generation',
            'working_capital': 'Working Capital Management'
        }

        const lowerParam = parameter?.toLowerCase() || ''
        for (const [key, value] of Object.entries(paramMap)) {
            if (lowerParam.includes(key)) return value
        }

        return parameter || 'Business Parameter'
    }

    /**
     * Format business context
     */
    private formatBusinessContext(companyData: any, extractedData: any): string {
        const context: string[] = []

        try {
            const businessAddress = companyData?.addresses?.business_address
            if (businessAddress) {
                if (businessAddress.about_the_company) {
                    context.push(`Business Description: ${businessAddress.about_the_company.substring(0, 200)}...`)
                }
                if (businessAddress.website) {
                    context.push(`Website: ${businessAddress.website}`)
                }
                if (businessAddress.date_of_last_agm) {
                    context.push(`Last AGM: ${businessAddress.date_of_last_agm}`)
                }
            }

            return context.length > 0 ? context.join('\n') : 'Business context not available'
        } catch (error) {
            console.error('Error formatting business context:', error)
            return 'Business context unavailable'
        }
    }

    /**
     * Format enhanced compliance status (without exposing internal scores)
     */
    private formatEnhancedComplianceStatus(extractedData: any, allScores: any[]): string {
        const compliance: string[] = []

        try {
            // Analyze compliance parameters without exposing internal scores
            const complianceScores = allScores.filter(score =>
                score.parameter?.toLowerCase().includes('compliance') ||
                score.parameter?.toLowerCase().includes('gst') ||
                score.parameter?.toLowerCase().includes('epfo') ||
                score.parameter?.toLowerCase().includes('hygiene')
            )

            // Provide qualitative assessment instead of raw scores
            complianceScores.forEach(score => {
                const performance = (score.score / score.maxScore) >= 0.7 ? 'Good' :
                    (score.score / score.maxScore) >= 0.4 ? 'Moderate' : 'Needs Improvement'
                const paramName = this.getBusinessParameterName(score.parameter)
                compliance.push(`${paramName}: ${performance} compliance status`)
            })

            // Add extracted compliance data (this is factual, not internal scoring)
            if (extractedData?.gst_records?.compliance_summary) {
                const gst = extractedData.gst_records.compliance_summary
                compliance.push(`GST Filing: ${gst.compliance_rate}% compliance rate, ${gst.total_returns} returns filed`)
            }

            if (extractedData?.epfo_records?.compliance_summary) {
                const epfo = extractedData.epfo_records.compliance_summary
                compliance.push(`EPFO: ${epfo.compliance_rate}% compliance rate`)
            }

            return compliance.length > 0 ? compliance.join('\n') : 'Compliance status not available'
        } catch (error) {
            console.error('Error formatting enhanced compliance status:', error)
            return 'Compliance status unavailable'
        }
    }

    /**
     * Identify key monitoring points based on risk analysis (without exposing internal scores)
     */
    private identifyMonitoringPoints(allScores: any[], financialData: any): string {
        const monitoringPoints: string[] = []

        try {
            // Identify areas needing attention without exposing scores
            const poorPerformers = allScores
                .filter(score => score.available && (score.score / score.maxScore) < 0.4)
                .sort((a, b) => b.weightage - a.weightage)
                .slice(0, 3)

            poorPerformers.forEach(score => {
                const paramName = this.getBusinessParameterName(score.parameter)
                monitoringPoints.push(`Monitor ${paramName}: Requires enhanced oversight and improvement`)
            })

            // Add financial trend monitoring
            if (financialData?.ratios?.growth_ratios?.revenue_growth_) {
                const revenueGrowths: number[] = Object.values(financialData.ratios.growth_ratios.revenue_growth_)
                const avgGrowth = revenueGrowths.reduce((a: number, b: number) => a + b, 0) / revenueGrowths.length
                if (avgGrowth < 5) {
                    monitoringPoints.push('Track revenue growth trends - currently below industry expectations')
                }
            }

            // Add standard monitoring recommendations
            if (monitoringPoints.length === 0) {
                monitoringPoints.push('Regular quarterly financial reviews recommended')
                monitoringPoints.push('Monitor compliance status and regulatory changes')
            }

            return monitoringPoints.length > 0 ? monitoringPoints.join('\n') : 'Standard monitoring protocols apply'
        } catch (error) {
            console.error('Error identifying monitoring points:', error)
            return 'Monitoring points analysis unavailable'
        }
    }

    /**
     * Build comprehensive financial analysis context
     */
    private buildFinancialAnalysisContext(financialData: any, latestYear: string): string {
        if (!financialData || !latestYear) return 'Financial analysis not available'

        try {
            const context: string[] = []

            // Revenue Analysis
            const revenue = financialData.profit_loss?.revenue?.net_revenue?.[latestYear]
            const revenueGrowth = financialData.ratios?.growth_ratios?.revenue_growth_?.[latestYear]
            if (revenue) {
                context.push(`Revenue: ₹${revenue.toFixed(1)} Cr${revenueGrowth ? ` (${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% growth)` : ''}`)
            }

            // Profitability Analysis
            const ebitda = financialData.profit_loss?.profitability?.['operating_profit_(_ebitda_)']?.[latestYear]
            const ebitdaMargin = financialData.ratios?.profitability?.ebitda_margin_?.[latestYear]
            const netMargin = financialData.ratios?.profitability?.net_margin_?.[latestYear]
            if (ebitda && ebitdaMargin) {
                context.push(`EBITDA: ₹${ebitda.toFixed(1)} Cr (${ebitdaMargin.toFixed(1)}% margin)`)
            }

            // Asset & Equity Position
            const totalAssets = financialData.balance_sheet?.totals?.total_assets?.[latestYear]
            const totalEquity = financialData.balance_sheet?.totals?.total_equity?.[latestYear]
            if (totalAssets && totalEquity) {
                context.push(`Total Assets: ₹${totalAssets.toFixed(1)} Cr, Equity: ₹${totalEquity.toFixed(1)} Cr`)
            }

            // Key Ratios
            const currentRatio = financialData.ratios?.liquidity?.current_ratio?.[latestYear]
            const debtEquity = financialData.ratios?.leverage?.debt_equity?.[latestYear]
            const roe = financialData.ratios?.profitability?.return_on_equity_?.[latestYear]
            if (currentRatio) context.push(`Current Ratio: ${currentRatio.toFixed(2)}`)
            if (debtEquity !== undefined) context.push(`Debt-to-Equity: ${debtEquity.toFixed(2)}`)
            if (roe) context.push(`ROE: ${roe.toFixed(1)}%`)

            return context.join('\n')
        } catch (error) {
            console.error('Error building financial analysis context:', error)
            return 'Financial analysis context unavailable'
        }
    }

    /**
     * Build balance sheet analysis context
     */
    private buildBalanceSheetContext(financialData: any): string {
        if (!financialData?.balance_sheet) return 'Balance sheet data not available'

        try {
            const years = financialData.years || []
            const latestYear = years[years.length - 1]
            const previousYear = years[years.length - 2]
            const balanceSheet = financialData.balance_sheet

            const context: string[] = []

            // Asset composition analysis
            const totalAssets = balanceSheet.totals?.total_assets?.[latestYear] || 0
            const currentAssets = balanceSheet.totals?.total_current_assets?.[latestYear] || 0
            const tangibleAssets = balanceSheet.assets?.fixed_assets?.tangible_assets?.[latestYear] || 0
            const tradeReceivables = balanceSheet.assets?.current_assets?.trade_receivables?.[latestYear] || 0
            const cash = balanceSheet.assets?.current_assets?.cash_and_bank_balances?.[latestYear] || 0

            if (totalAssets > 0) {
                context.push(`Asset Quality: Current assets ${((currentAssets / totalAssets) * 100).toFixed(1)}%, Tangible assets ${((tangibleAssets / totalAssets) * 100).toFixed(1)}%`)
                context.push(`Liquidity Strength: Cash position ${((cash / currentAssets) * 100).toFixed(1)}% of current assets`)
            }

            // Liability and equity analysis
            const totalEquity = balanceSheet.totals?.total_equity?.[latestYear] || 0
            const currentLiabilities = balanceSheet.totals?.total_current_liabilities?.[latestYear] || 0
            const longTermDebt = balanceSheet.liabilities?.non_current_liabilities?.long_term_borrowings?.[latestYear] || 0

            if (totalAssets > 0) {
                const leverageRatio = ((totalAssets - totalEquity) / totalAssets) * 100
                context.push(`Leverage Analysis: Total debt-to-assets ${leverageRatio.toFixed(1)}%`)
            }

            // Working capital analysis
            const workingCapital = currentAssets - currentLiabilities
            context.push(`Working Capital: ₹${workingCapital.toFixed(1)} Cr (${workingCapital >= 0 ? 'positive' : 'negative'})`)

            // Growth analysis
            if (previousYear && totalAssets && balanceSheet.totals?.total_assets?.[previousYear]) {
                const assetGrowth = ((totalAssets - balanceSheet.totals.total_assets[previousYear]) / balanceSheet.totals.total_assets[previousYear]) * 100
                context.push(`Asset Growth: ${assetGrowth > 0 ? '+' : ''}${assetGrowth.toFixed(1)}% YoY`)
            }

            return context.join('\n')
        } catch (error) {
            console.error('Error building balance sheet context:', error)
            return 'Balance sheet analysis unavailable'
        }
    }

    /**
     * Build cash flow analysis context
     */
    private buildCashFlowContext(financialData: any): string {
        if (!financialData?.cash_flow) return 'Cash flow data not available'

        try {
            const years = financialData.years || []
            const latestYear = years[years.length - 1]
            const cashFlow = financialData.cash_flow

            const context: string[] = []

            // Operating cash flow analysis
            const operatingCF = cashFlow.operating_activities?.['net_cash_flows_from_(_used_in_)_operating_activities']?.[latestYear] || 0
            const revenue = financialData.profit_loss?.revenue?.net_revenue?.[latestYear] || 0
            const netIncome = financialData.profit_loss?.profitability?.profit_for_the_period?.[latestYear] || 0

            context.push(`Operating Cash Flow: ₹${operatingCF.toFixed(1)} Cr (${operatingCF >= 0 ? 'positive' : 'negative'})`)

            if (revenue > 0) {
                const cfMargin = (operatingCF / revenue) * 100
                context.push(`Operating CF Margin: ${cfMargin.toFixed(1)}%`)
            }

            if (netIncome > 0) {
                const cfQuality = operatingCF / netIncome
                context.push(`Cash Conversion Quality: ${cfQuality.toFixed(2)}x (OCF vs Net Income)`)
            }

            // Investing activities
            const assetPurchases = cashFlow.investing_activities?.cash_outflow_from_purchase_of_assets?.[latestYear] || 0
            const assetSales = cashFlow.investing_activities?.cash_inflow_from_sale_of_assets?.[latestYear] || 0
            const investingCF = assetSales - assetPurchases + (cashFlow.investing_activities?.income_from_assets?.[latestYear] || 0)

            // Free cash flow calculation
            const freeCashFlow = operatingCF + investingCF
            context.push(`Free Cash Flow: ₹${freeCashFlow.toFixed(1)} Cr${freeCashFlow >= 0 ? ' (positive - supports growth/debt service)' : ' (negative - may need external financing)'}`)

            // Financing activities
            const capitalRaised = cashFlow.financing_activities?.cash_inflow_from_raising_capital_and_borrowings?.[latestYear] || 0
            const debtRepayment = cashFlow.financing_activities?.cash_outflow_from_repayment_of_capital_and_borrowings?.[latestYear] || 0
            const netFinancing = capitalRaised - debtRepayment

            if (Math.abs(netFinancing) > 0) {
                context.push(`Financing Activity: ${netFinancing >= 0 ? 'Net borrowing' : 'Net debt reduction'} of ₹${Math.abs(netFinancing).toFixed(1)} Cr`)
            }

            // Cash flow quality assessment
            if (operatingCF > 0 && freeCashFlow > 0 && operatingCF > netIncome) {
                context.push(`Cash Flow Quality: EXCELLENT - Strong operating CF, positive free CF, good earnings conversion`)
            } else if (operatingCF > 0 && operatingCF > netIncome * 0.8) {
                context.push(`Cash Flow Quality: GOOD - Positive operating CF with acceptable earnings conversion`)
            } else if (operatingCF > 0) {
                context.push(`Cash Flow Quality: MODERATE - Positive operating CF but below optimal conversion`)
            } else {
                context.push(`Cash Flow Quality: POOR - Negative operating CF indicates liquidity concerns`)
            }

            return context.join('\n')
        } catch (error) {
            console.error('Error building cash flow context:', error)
            return 'Cash flow analysis unavailable'
        }
    }

    /**
     * Build profitability analysis context
     */
    private buildProfitabilityContext(financialData: any): string {
        if (!financialData?.profit_loss) return 'Profitability data not available'

        try {
            const years = financialData.years || []
            const latestYear = years[years.length - 1]
            const profitLoss = financialData.profit_loss
            const ratios = financialData.ratios

            const context: string[] = []

            // Core profitability metrics
            const revenue = profitLoss.revenue?.net_revenue?.[latestYear] || 0
            const ebitda = profitLoss.profitability?.['operating_profit_(_ebitda_)']?.[latestYear] || 0
            const pat = profitLoss.profitability?.profit_for_the_period?.[latestYear] || 0

            // Margin analysis
            const ebitdaMargin = ratios?.profitability?.ebitda_margin_?.[latestYear] || 0
            const netMargin = ratios?.profitability?.net_margin_?.[latestYear] || 0
            const grossMargin = ratios?.profitability?.gross_profit_margin_?.[latestYear] || 0

            context.push(`Margin Profile: Gross ${grossMargin.toFixed(1)}%, EBITDA ${ebitdaMargin.toFixed(1)}%, Net ${netMargin.toFixed(1)}%`)

            // Expense structure analysis
            const totalOpCost = profitLoss.operating_costs?.total_operating_cost?.[latestYear] || 0
            const employeeCost = profitLoss.operating_costs?.employee_benefit_expense?.[latestYear] || 0
            const materialCost = profitLoss.operating_costs?.cost_of_materials_consumed?.[latestYear] || 0

            if (revenue > 0) {
                context.push(`Cost Structure: Operating costs ${((totalOpCost / revenue) * 100).toFixed(1)}% of revenue`)
                if (employeeCost > 0) context.push(`Employee Cost Ratio: ${((employeeCost / revenue) * 100).toFixed(1)}%`)
                if (materialCost > 0) context.push(`Material Cost Ratio: ${((materialCost / revenue) * 100).toFixed(1)}%`)
            }

            // Returns analysis
            const roe = ratios?.profitability?.return_on_equity_?.[latestYear] || 0
            const roce = ratios?.profitability?.return_on_capital_employed_?.[latestYear] || 0
            if (roe > 0) context.push(`Return on Equity: ${roe.toFixed(1)}%`)
            if (roce > 0) context.push(`Return on Capital: ${roce.toFixed(1)}%`)

            // Interest coverage
            const ebit = profitLoss.profitability?.profit_before_interest_and_tax?.[latestYear] || 0
            const interest = profitLoss.finance_costs?.finance_costs?.[latestYear] || 0
            if (ebit > 0 && interest > 0) {
                const coverage = ebit / interest
                context.push(`Interest Coverage: ${coverage.toFixed(1)}x (${coverage >= 3 ? 'strong' : coverage >= 2 ? 'adequate' : 'weak'})`)
            }

            // Profitability quality assessment
            if (ebitdaMargin >= 15 && netMargin >= 10 && roe >= 15) {
                context.push(`Profitability Quality: EXCELLENT - Strong margins and returns across all metrics`)
            } else if (ebitdaMargin >= 10 && netMargin >= 5 && roe >= 10) {
                context.push(`Profitability Quality: GOOD - Healthy margins with room for improvement`)
            } else if (ebitdaMargin >= 5 && netMargin >= 2) {
                context.push(`Profitability Quality: MODERATE - Acceptable margins requiring operational focus`)
            } else {
                context.push(`Profitability Quality: POOR - Below-average margins indicating operational challenges`)
            }

            return context.join('\n')
        } catch (error) {
            console.error('Error building profitability context:', error)
            return 'Profitability analysis unavailable'
        }
    }

    /**
     * Build comprehensive ratios analysis context
     */
    private buildRatiosContext(financialData: any): string {
        if (!financialData?.ratios) return 'Ratios data not available'

        try {
            const years = financialData.years || []
            const latestYear = years[years.length - 1]
            const ratios = financialData.ratios

            const context: string[] = []

            // Liquidity ratios
            const currentRatio = ratios.liquidity?.current_ratio?.[latestYear] || 0
            const quickRatio = ratios.liquidity?.quick_ratio?.[latestYear] || 0
            context.push(`Liquidity Position: Current ratio ${currentRatio.toFixed(2)}, Quick ratio ${quickRatio.toFixed(2)}`)

            const liquidityAssessment = currentRatio >= 2 && quickRatio >= 1 ? 'EXCELLENT' :
                currentRatio >= 1.5 && quickRatio >= 0.8 ? 'GOOD' :
                    currentRatio >= 1 && quickRatio >= 0.5 ? 'ADEQUATE' : 'POOR'
            context.push(`Liquidity Quality: ${liquidityAssessment}`)

            // Efficiency ratios
            const debtorDays = ratios.efficiency?.['debtors_sales_(days)']?.[latestYear] || 0
            const inventoryDays = ratios.efficiency?.['inventory_sales_(days)']?.[latestYear] || 0
            const creditorDays = ratios.efficiency?.['payables_sales_(days)']?.[latestYear] || 0
            const cashCycle = ratios.efficiency?.['cash_conversion_cycle_(days)']?.[latestYear] || 0

            if (debtorDays > 0) context.push(`Working Capital Efficiency: Debtor days ${debtorDays.toFixed(0)}, Inventory days ${inventoryDays.toFixed(0)}, Cash cycle ${cashCycle.toFixed(0)} days`)

            // Leverage analysis
            const debtEquity = ratios.leverage?.debt_equity?.[latestYear] || 0
            const interestCoverage = ratios.leverage?.interest_coverage_ratio?.[latestYear] || 0
            const debtRatio = ratios.leverage?.debt_ratio?.[latestYear] || 0

            context.push(`Leverage Metrics: D/E ratio ${debtEquity.toFixed(2)}, Interest coverage ${interestCoverage.toFixed(1)}x, Debt ratio ${debtRatio.toFixed(2)}`)

            const leverageAssessment = debtEquity <= 0.5 && interestCoverage >= 5 ? 'LOW RISK' :
                debtEquity <= 1 && interestCoverage >= 3 ? 'MODERATE RISK' :
                    debtEquity <= 2 && interestCoverage >= 2 ? 'ELEVATED RISK' : 'HIGH RISK'
            context.push(`Financial Risk Level: ${leverageAssessment}`)

            // Overall financial health score calculation
            let healthScore = 0
            // Profitability scoring (40 points)
            const ebitdaMargin = ratios.profitability?.ebitda_margin_?.[latestYear] || 0
            const netMargin = ratios.profitability?.net_margin_?.[latestYear] || 0
            const roe = ratios.profitability?.return_on_equity_?.[latestYear] || 0

            if (ebitdaMargin >= 15) healthScore += 15
            else if (ebitdaMargin >= 10) healthScore += 10
            else if (ebitdaMargin >= 5) healthScore += 5

            if (netMargin >= 10) healthScore += 15
            else if (netMargin >= 5) healthScore += 10
            else if (netMargin >= 2) healthScore += 5

            if (roe >= 15) healthScore += 10
            else if (roe >= 10) healthScore += 7
            else if (roe >= 5) healthScore += 3

            // Liquidity scoring (20 points)
            if (currentRatio >= 2) healthScore += 10
            else if (currentRatio >= 1.5) healthScore += 7
            else if (currentRatio >= 1) healthScore += 3

            if (quickRatio >= 1) healthScore += 10
            else if (quickRatio >= 0.8) healthScore += 7
            else if (quickRatio >= 0.5) healthScore += 3

            // Efficiency scoring (20 points)
            if (cashCycle <= 60) healthScore += 10
            else if (cashCycle <= 120) healthScore += 5

            // Leverage scoring (20 points)
            if (debtEquity <= 0.5) healthScore += 10
            else if (debtEquity <= 1) healthScore += 7
            else if (debtEquity <= 2) healthScore += 3

            if (interestCoverage >= 5) healthScore += 10
            else if (interestCoverage >= 3) healthScore += 7
            else if (interestCoverage >= 2) healthScore += 3

            context.push(`Financial Health Score: ${Math.min(100, healthScore)}/100`)

            return context.join('\n' + financialData)
        } catch (error) {
            console.error('Error building ratios context:', error)
            return 'Ratios analysis unavailable'
        }
    }

    /**
     * Build risk trend analysis context (without exposing internal scores)
     */
    private buildRiskTrendContext(allScores: any[], financialData: any): string {
        try {
            const context: string[] = []

            // Risk factor identification without exposing scores
            const poorPerformers = allScores
                .filter(score => score.available && (score.score / score.maxScore) <= 0.4)
                .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))
                .slice(0, 3)

            const goodPerformers = allScores
                .filter(score => score.available && (score.score / score.maxScore) >= 0.7)
                .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
                .slice(0, 3)

            if (poorPerformers.length > 0) {
                const riskAreas = poorPerformers.map(p => this.getBusinessParameterName(p.parameter)).join(', ')
                context.push(`Key Risk Factors: ${riskAreas}`)
            }

            if (goodPerformers.length > 0) {
                const strengthAreas = goodPerformers.map(p => this.getBusinessParameterName(p.parameter)).join(', ')
                context.push(`Strength Areas: ${strengthAreas}`)
            }

            // Revenue and margin trend analysis (factual data, not internal scoring)
            if (financialData?.ratios?.growth_ratios?.revenue_growth_) {
                const revenueGrowths: number[] = Object.values(financialData.ratios.growth_ratios.revenue_growth_)
                const avgGrowth = revenueGrowths.reduce((a: number, b: number) => a + b, 0) / revenueGrowths.length
                context.push(`Revenue Trend: ${avgGrowth.toFixed(1)}% average growth (recent 3 years)`)
            }

            // Risk trajectory assessment without exposing calculation methodology
            const strongParams = allScores.filter(score => score.available && (score.score / score.maxScore) >= 0.7).length
            const weakParams = allScores.filter(score => score.available && (score.score / score.maxScore) < 0.4).length
            const totalParams = allScores.filter(score => score.available).length

            let trajectory = 'STABLE - Mixed performance indicators'
            if (strongParams > weakParams && strongParams / totalParams > 0.6) {
                trajectory = 'IMPROVING - Strong fundamentals support positive outlook'
            } else if (weakParams > strongParams && weakParams / totalParams > 0.4) {
                trajectory = 'DETERIORATING - Multiple risk factors require attention'
            }

            context.push(`Risk Trajectory: ${trajectory}`)

            return context.join('\n')
        } catch (error) {
            console.error('Error building risk trend context:', error)
            return 'Risk trend analysis unavailable'
        }
    }

    /**
     * Format directors and shareholding pattern context
     */
    private formatDirectorsAndShareholding(extractedData: any): string {
        try {
            const context: string[] = []
            const directors = extractedData?.['Directors']
            const shareholding = extractedData?.['Shareholding More Than 5%']
            const directorShareholding = extractedData?.['Director Shareholding']

            // Active Directors Summary
            if (directors?.data) {
                const activeDirectors = directors.data.filter((d: any) => !d.date_of_cessation || d.date_of_cessation === '' || d.date_of_cessation === '-')
                const inactiveDirectors = directors.data.filter((d: any) => d.date_of_cessation && d.date_of_cessation !== '' && d.date_of_cessation !== '-')

                context.push(`Board Composition: ${activeDirectors.length} active directors, ${inactiveDirectors.length} former directors`)

                if (activeDirectors.length > 0) {
                    const directorsList = activeDirectors.slice(0, 5).map((d: any) =>
                        `${d.name} (${d.present_designation}, DIN: ${d.din})`
                    ).join(', ')
                    context.push(`Key Directors: ${directorsList}${activeDirectors.length > 5 ? ` and ${activeDirectors.length - 5} more` : ''}`)
                }
            }

            // Shareholding Pattern
            if (shareholding?.data) {
                let latestYear = ''
                for (const item of shareholding.data) {
                    const year = item.financial_year_ending_on || ''
                    if (!latestYear || year > latestYear) {
                        latestYear = year
                    }
                }

                if (latestYear) {
                    const latestShareholding = shareholding.data
                        .filter((item: any) => item.financial_year_ending_on === latestYear)
                        .sort((a: any, b: any) => parseFloat(b.shareholding || '0') - parseFloat(a.shareholding || '0'))
                        .slice(0, 5)

                    if (latestShareholding.length > 0) {
                        const shareholdingList = latestShareholding.map((s: any) =>
                            `${s.entity_name}: ${s.shareholding}%`
                        ).join(', ')
                        context.push(`Major Shareholders (${latestYear}): ${shareholdingList}`)

                        const totalHolding = latestShareholding.reduce((sum: number, s: any) =>
                            sum + parseFloat(s.shareholding || '0'), 0
                        )
                        context.push(`Top 5 Shareholders Control: ${totalHolding.toFixed(1)}% of equity`)
                    }
                }
            }

            // Director Shareholding Summary
            if (directorShareholding?.data) {
                const totalDirectorHolding = directorShareholding.data.reduce((sum: number, ds: any) =>
                    sum + parseFloat(ds.shareholding || '0'), 0
                )
                const directorsWithShares = directorShareholding.data.filter((ds: any) =>
                    parseFloat(ds.shareholding || '0') > 0
                ).length

                context.push(`Director Shareholding: ${directorsWithShares} directors hold ${totalDirectorHolding.toFixed(1)}% total equity`)
            }

            return context.length > 0 ? context.join('\n') : 'Directors and shareholding data not available'
        } catch (error) {
            console.error('Error formatting directors and shareholding:', error)
            return 'Directors and shareholding analysis unavailable'
        }
    }

    /**
     * Format legal cases context
     */
    private formatLegalCasesContext(extractedData: any): string {
        try {
            const context: string[] = []
            const legalData = extractedData?.['Legal History']

            if (legalData?.data) {
                // Filter for valid cases (exclude header rows)
                const validCases = legalData.data.filter((case_: any) =>
                    case_.court && case_.case_no && case_._row_index < 450
                )

                const pendingCases = validCases.filter((case_: any) =>
                    case_.case_status?.toLowerCase() === 'pending'
                )
                const disposedCases = validCases.filter((case_: any) =>
                    case_.case_status?.toLowerCase() === 'disposed'
                )

                context.push(`Legal Cases Summary: ${validCases.length} total cases (${pendingCases.length} pending, ${disposedCases.length} disposed)`)

                // Case categories breakdown
                const casesByCategory = validCases.reduce((acc: any, case_: any) => {
                    const category = case_.case_category || 'Other'
                    acc[category] = (acc[category] || 0) + 1
                    return acc
                }, {})

                if (Object.keys(casesByCategory).length > 0) {
                    const categoriesList = Object.entries(casesByCategory)
                        .sort(([, a]: any, [, b]: any) => b - a)
                        .slice(0, 3)
                        .map(([category, count]) => `${category}: ${count}`)
                        .join(', ')
                    context.push(`Case Categories: ${categoriesList}`)
                }

                // Recent activity (last 12 months)
                const oneYearAgo = new Date('2024-08-30')
                const recentCases = pendingCases.filter((case_: any) => {
                    if (case_.date_of_last_hearing_judgement && case_.date_of_last_hearing_judgement !== '-') {
                        try {
                            const hearingDate = new Date(case_.date_of_last_hearing_judgement)
                            return hearingDate >= oneYearAgo
                        } catch (e) {
                            return false
                        }
                    }
                    return false
                })

                if (recentCases.length > 0) {
                    context.push(`Recent Legal Activity: ${recentCases.length} cases with hearings in last 12 months`)
                }
            }

            return context.length > 0 ? context.join('\n') : 'No significant legal cases on record'
        } catch (error) {
            console.error('Error formatting legal cases context:', error)
            return 'Legal cases analysis unavailable'
        }
    }

    /**
     * Format credit ratings context
     */
    private formatCreditRatingsContext(extractedData: any): string {
        try {
            const context: string[] = []
            const ratingsData = extractedData?.['Credit Ratings']

            if (ratingsData?.data && ratingsData.data.length > 0) {
                // Get latest ratings by agency
                const latestRatings = ratingsData.data
                    .filter((rating: any) => rating.rating_agency && rating.rating)
                    .sort((a: any, b: any) => new Date(b.date || '1900-01-01').getTime() - new Date(a.date || '1900-01-01').getTime())

                const ratingsByAgency = latestRatings.reduce((acc: any, rating: any) => {
                    const agency = rating.rating_agency
                    if (!acc[agency] || new Date(rating.date || '1900-01-01') > new Date(acc[agency].date || '1900-01-01')) {
                        acc[agency] = rating
                    }
                    return acc
                }, {})

                if (Object.keys(ratingsByAgency).length > 0) {
                    const ratingsList = Object.entries(ratingsByAgency)
                        .map(([agency, rating]: any) => `${agency}: ${rating.rating} (${rating.outlook || 'N/A'})`)
                        .join(', ')
                    context.push(`Current Credit Ratings: ${ratingsList}`)

                    // Total rated facilities
                    const totalRatedAmount = latestRatings.reduce((sum: number, rating: any) => {
                        const amount = parseFloat(rating.amount_rated?.replace(/[^\d.]/g, '') || '0')
                        return sum + amount
                    }, 0)

                    if (totalRatedAmount > 0) {
                        context.push(`Total Rated Facilities: ₹${(totalRatedAmount / 10000000).toFixed(0)} Cr`)
                    }

                    // Recent rating actions
                    const recentActions = latestRatings
                        .filter((rating: any) => rating.rating_action && rating.rating_action !== 'N/A')
                        .slice(0, 3)
                        .map((rating: any) => `${rating.rating_agency}: ${rating.rating_action}`)
                        .join(', ')

                    if (recentActions) {
                        context.push(`Recent Rating Actions: ${recentActions}`)
                    }
                }
            }

            return context.length > 0 ? context.join('\n') : 'No credit ratings available'
        } catch (error) {
            console.error('Error formatting credit ratings context:', error)
            return 'Credit ratings analysis unavailable'
        }
    }

    /**
     * Format banking relationships and charges context
     */
    private formatBankingContext(extractedData: any): string {
        try {
            const context: string[] = []
            const chargesData = extractedData?.['Open Charges Sequence']

            // Charges summary
            if (chargesData?.data && chargesData.data.length > 0) {
                const activeCharges = chargesData.data.filter((charge: any) =>
                    charge["STATUS"]?.toLowerCase() === 'creation' || charge["STATUS"]?.toLowerCase() === 'modification'
                )
                const satisfiedCharges = chargesData.data.filter((charge: any) =>
                    charge["STATUS"]?.toLowerCase() === 'satisfied' || charge["STATUS"]?.toLowerCase() === 'closed'
                )

                context.push(`Registered Charges: ${chargesData.data.length} total (${activeCharges.length} active, ${satisfiedCharges.length} satisfied)`)

                // Sum of charge amounts
                const totalChargeAmount = chargesData.data.reduce((sum: number, charge: any) => {
                    const amount = parseFloat(charge["CHARGE AMOUNT (Rs. Crore)"]?.replace(/[^\d.]/g, '') || '0')
                    return sum + amount
                }, 0)

                if (totalChargeAmount > 0) {
                    context.push(`Total Charge Amount: ₹${(totalChargeAmount).toFixed(0)} Cr`)
                }

                // Charge types
                const chargeTypes = chargesData.data.reduce((acc: any, charge: any) => {
                    const type = charge.charge_type || 'Other'
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                }, {})

                if (Object.keys(chargeTypes).length > 0) {
                    const typesList = Object.entries(chargeTypes)
                        .sort(([, a]: any, [, b]: any) => b - a)
                        .slice(0, 3)
                        .map(([type, count]) => `${type}: ${count}`)
                        .join(', ')
                    context.push(`Charge Types: ${typesList}`)
                }
            }

            return context.length > 0 ? context.join('\n') : 'Banking relationships and charges data not available'
        } catch (error) {
            console.error('Error formatting banking context:', error)
            return 'Banking relationships analysis unavailable'
        }
    }

    /**
     * Helper methods for mock responses
     */
    private getRevenueGrowthContext(financialData: any): string {
        try {
            const latestGrowth = Object.values(financialData.ratios?.growth_ratios?.revenue_growth_ || {}).pop()
            if (typeof latestGrowth === 'number') {
                return latestGrowth > 10 ? 'strong growth' : latestGrowth > 0 ? 'moderate growth' : 'declining revenue'
            }
        } catch (error) {
            console.error('Error getting revenue growth context:', error)
        }
        return 'varied performance'
    }

    private getMockRiskInsights(company: PortfolioCompany): string {
        const riskScore = company.risk_analysis?.overallPercentage || company.risk_score
        if (typeof riskScore === 'number') {
            if (riskScore >= 70) return 'Strong financial position with low credit risk indicators.'
            if (riskScore >= 50) return 'Moderate risk profile with some areas requiring attention.'
            return 'Higher risk profile - careful monitoring and enhanced due diligence recommended.'
        }
        return 'Risk assessment requires detailed analysis of available financial data.'
    }

    private getMockBottomLine(riskGrade: any, riskScore: any): string {
        if (typeof riskScore === 'number') {
            if (riskScore >= 70) return 'Recommend proceeding with standard credit terms.'
            if (riskScore >= 50) return 'Consider conditional approval with enhanced monitoring.'
            return 'Requires senior approval and strong risk mitigation measures.'
        }
        return 'Detailed risk assessment needed before credit decision.'
    }

    private getMockTrendStatus(company: PortfolioCompany): string {
        const riskScore = company.risk_analysis?.overallPercentage || company.risk_score
        if (typeof riskScore === 'number') {
            if (riskScore >= 70) return 'Positive'
            if (riskScore >= 50) return 'Stable'
            return 'Declining'
        }
        return 'Mixed'
    }

    private getMockProfitabilityStatus(company: PortfolioCompany): string {
        return 'EBITDA margins stable, net profitability improving'
    }

    private getMockLiquidityStatus(company: PortfolioCompany): string {
        return 'Current ratio above 1.5x, adequate working capital'
    }

    private getMockLeverageStatus(company: PortfolioCompany): string {
        return 'Debt-to-equity within industry norms'
    }

    private getMockCategoryScore(category: string): string {
        const scores = {
            financial: '72%',
            business: '68%',
            compliance: '85%'
        }
        return scores[category as keyof typeof scores] || '65%'
    }

    private getMockPerformanceStatus(category: string): string {
        const statuses = {
            financial: 'Above Average',
            business: 'Average',
            compliance: 'Excellent'
        }
        return statuses[category as keyof typeof statuses] || 'Average'
    }

    private getMockStrengths(company: PortfolioCompany): string {
        return 'Strong market position, consistent revenue growth, good compliance track record'
    }

    private getMockConcerns(company: PortfolioCompany): string {
        return 'Working capital cycle optimization needed, monitor receivables collection'
    }

    private getMockMonitoringPoints(company: PortfolioCompany): string {
        return 'Quarterly financial reviews, compliance status updates, market position assessment'
    }

    private getMockRecommendation(riskGrade: any, riskScore: any): string {
        if (typeof riskScore === 'number') {
            if (riskScore >= 70) return '**APPROVE:** Credit facility recommended with standard terms and conditions.'
            if (riskScore >= 50) return '**CONDITIONAL APPROVAL:** Proceed with enhanced monitoring and periodic reviews.'
            return '**REFER TO COMMITTEE:** Requires senior management approval with strict risk mitigation measures.'
        }
        return '**PENDING:** Complete risk assessment required before final recommendation.'
    }

    /**
     * Build conversation messages for Claude API
     */
    private buildConversationMessages(
        currentMessage: string,
        company: PortfolioCompany,
        messageHistory: ChatMessage[]
    ): Array<{ role: 'user' | 'assistant'; content: string }> {
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

        // Validate current message
        if (!currentMessage || typeof currentMessage !== 'string' || currentMessage.trim() === '') {
            throw new Error('Current message is required and must be a non-empty string')
        }

        // Add recent message history (excluding system messages)
        if (messageHistory && Array.isArray(messageHistory)) {
            messageHistory
                .filter(msg => msg && msg.role && msg.content && (msg.role === 'user' || msg.role === 'assistant'))
                .slice(-10) // Last 10 messages for context
                .forEach(msg => {
                    if (typeof msg.content === 'string' && msg.content.trim() !== '') {
                        messages.push({
                            role: msg.role as 'user' | 'assistant',
                            content: msg.content.trim()
                        })
                    }
                })
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: currentMessage.trim()
        })

        return messages
    }

    /**
     * Build company context data (enhanced to include risk_analysis)
     */
    private buildCompanyContext(company: PortfolioCompany): Json {
        return {
            company_name: company.company_name || "",
            industry: company.industry,
            risk_score: company.risk_score || 0,
            risk_grade: company.risk_grade || "",
            recommended_limit: company.recommended_limit || 0,
            financial_data: company.extracted_data?.financial_data,
            compliance_data: {
                gst_records: company.extracted_data?.gst_records,
                epfo_records: company.extracted_data?.epfo_records,
                audit_qualifications: company.extracted_data?.audit_qualifications
            },
            risk_analysis: company.risk_analysis, // Include full risk analysis
            extracted_data: company.extracted_data
        } as Json
    }

    /**
     * Format financial metrics for context (kept for backward compatibility)
     */
    private formatFinancialMetrics(company: PortfolioCompany): string {
        try {
            const financialData = company.extracted_data?.financial_data
            if (!financialData) return 'Financial data not available'

            const latestYear = financialData.years?.[financialData.years.length - 1]
            if (!latestYear) return 'No financial year data available'

            const metrics: string[] = []

            // Revenue
            const revenue = financialData.profit_loss?.revenue?.[financialData.years.length - 1]
            if (revenue && typeof revenue === 'number') {
                metrics.push(`Revenue: ₹${(revenue / 10000000).toFixed(2)} Cr`)
            }

            // EBITDA
            const ebitda = financialData.profit_loss?.ebitda?.[financialData.years.length - 1]
            if (ebitda && typeof ebitda === 'number') {
                metrics.push(`EBITDA: ₹${(ebitda / 10000000).toFixed(2)} Cr`)
            }

            // Key Ratios
            const ratios = financialData.ratios
            if (ratios) {
                const currentRatio = ratios.liquidity?.current_ratio?.[latestYear]
                if (currentRatio && typeof currentRatio === 'number') {
                    metrics.push(`Current Ratio: ${currentRatio.toFixed(2)}`)
                }

                const debtEquity = ratios.leverage?.debt_equity?.[latestYear]
                if (debtEquity && typeof debtEquity === 'number') {
                    metrics.push(`Debt-to-Equity: ${debtEquity.toFixed(2)}`)
                }

                const ebitdaMargin = ratios.profitability?.ebitda_margin?.[latestYear]
                if (ebitdaMargin && typeof ebitdaMargin === 'number') {
                    metrics.push(`EBITDA Margin: ${ebitdaMargin.toFixed(2)}%`)
                }
            }

            return metrics.length > 0 ? metrics.join(', ') : 'Key metrics not available'
        } catch (error) {
            console.error('Error formatting financial metrics:', error)
            return 'Financial metrics unavailable due to data format error'
        }
    }

    /**
     * Format risk analysis for context (kept for backward compatibility)
     */
    private formatRiskAnalysis(company: PortfolioCompany): string {
        try {
            const riskAnalysis = company.risk_analysis
            if (!riskAnalysis) return 'Risk analysis not available'

            const summary: string[] = []

            if (riskAnalysis.overallPercentage !== undefined && riskAnalysis.overallPercentage !== null) {
                summary.push(`Overall Score: ${riskAnalysis.overallPercentage}%`)
            }

            if (riskAnalysis.overallGrade?.description) {
                summary.push(`Risk Category: ${riskAnalysis.overallGrade.description}`)
            }

            if (riskAnalysis.categories) {
                riskAnalysis.categories.forEach((category: any) => {
                    if (category.result) {
                        summary.push(`${category.label}: ${category.result.percentage?.toFixed(1)}%`)
                    }
                })
            }

            return summary.length > 0 ? summary.join(', ') : 'Risk analysis data incomplete'
        } catch (error) {
            console.error('Error formatting risk analysis:', error)
            return 'Risk analysis unavailable due to data format error'
        }
    }

    /**
     * Format compliance status for context (kept for backward compatibility)
     */
    private formatComplianceStatus(company: PortfolioCompany): string {
        try {
            const extractedData = company.extracted_data
            if (!extractedData) return 'Compliance data not available'

            const compliance: string[] = []

            // GST Compliance
            const gstRecords = extractedData.gst_records
            if (gstRecords?.compliance_summary?.compliance_rate !== undefined) {
                compliance.push(`GST Compliance: ${gstRecords.compliance_summary.compliance_rate}%`)
            }

            // EPFO Compliance
            const epfoRecords = extractedData.epfo_records
            if (epfoRecords?.compliance_summary?.compliance_rate !== undefined) {
                compliance.push(`EPFO Compliance: ${epfoRecords.compliance_summary.compliance_rate}%`)
            }

            // Audit Status
            const auditQualifications = extractedData.audit_qualifications
            if (auditQualifications && Array.isArray(auditQualifications) && auditQualifications.length > 0) {
                const latestAudit = auditQualifications[auditQualifications.length - 1]
                if (latestAudit?.qualification_type) {
                    compliance.push(`Audit Status: ${latestAudit.qualification_type}`)
                }
            }

            return compliance.length > 0 ? compliance.join(', ') : 'Compliance status not available'
        } catch (error) {
            console.error('Error formatting compliance status:', error)
            return 'Compliance status unavailable due to data format error'
        }
    }

    /**
     * Calculate API cost based on token usage (updated pricing for Claude 4)
     */
    private calculateCost(usage: { input_tokens: number; output_tokens: number }, model: string): number {
        // Updated Claude 4 pricing
        const pricing = {
            'claude-sonnet-4-20250514': { input: 3, output: 15 }, // per 1M tokens
            'claude-3-opus-20240229': { input: 15, output: 75 },
            'claude-3-sonnet-20240229': { input: 3, output: 15 },
            'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
        }

        const modelPricing = pricing[model as keyof typeof pricing] || pricing['claude-sonnet-4-20250514']

        const inputCost = (usage.input_tokens / 1000000) * modelPricing.input
        const outputCost = (usage.output_tokens / 1000000) * modelPricing.output

        return inputCost + outputCost
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            const { error } = await supabase
                .from('ai_chat_conversations')
                .delete()
                .eq('id', conversationId)
                .eq('user_id', userId)

            if (error) {
                throw new Error(`Failed to delete conversation: ${error.message}`)
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            throw error
        }
    }

    /**
     * Archive a conversation
     */
    async archiveConversation(conversationId: string, userId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            const { error } = await supabase
                .from('ai_chat_conversations')
                .update({ is_archived: true })
                .eq('id', conversationId)
                .eq('user_id', userId)

            if (error) {
                throw new Error(`Failed to archive conversation: ${error.message}`)
            }
        } catch (error) {
            console.error('Error archiving conversation:', error)
            throw error
        }
    }
}