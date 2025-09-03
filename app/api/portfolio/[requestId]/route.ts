import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const portfolioRepository = new PortfolioRepository()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { requestId } = await params

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        const company = await portfolioRepository.getCompanyByRequestId(requestId, user.id)

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        // Get related companies in the same industry for comparison
        const relatedCompanies = await portfolioRepository.getRelatedCompanies(
            company.industry,
            requestId,
            5, // limit to 5 related companies
            user.id
        )

        // Get industry benchmarks
        const industryBenchmarks = await portfolioRepository.getIndustryBenchmarks(company.industry, user.id)

        return NextResponse.json({
            company,
            related_companies: relatedCompanies,
            industry_benchmarks: industryBenchmarks
        })

    } catch (error) {
        console.error('Company detail API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch company details' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const portfolioRepository = new PortfolioRepository()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { requestId } = await params
        const updateData = await request.json()

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        // Verify user has access to this company
        const existingCompany = await portfolioRepository.getCompanyByRequestId(requestId, user.id)
        if (!existingCompany) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        const updatedCompany = await portfolioRepository.updateCompanyData(requestId, updateData)

        return NextResponse.json({
            success: true,
            company: updatedCompany
        })

    } catch (error) {
        console.error('Company update API error:', error)
        return NextResponse.json(
            { error: 'Failed to update company data' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const portfolioRepository = new PortfolioRepository()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { requestId } = await params

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        // Verify user has access to this company
        const existingCompany = await portfolioRepository.getCompanyByRequestId(requestId, user.id)
        if (!existingCompany) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        await portfolioRepository.deleteCompany(requestId, user.id)

        return NextResponse.json({
            success: true,
            message: 'Company deleted successfully'
        })

    } catch (error) {
        console.error('Company delete API error:', error)
        return NextResponse.json(
            { error: 'Failed to delete company' },
            { status: 500 }
        )
    }
}