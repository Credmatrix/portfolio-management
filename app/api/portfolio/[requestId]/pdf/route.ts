import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { awsApiService } from '@/lib/services/aws-api.service'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const portfolioRepository = new PortfolioRepository();

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { requestId } = await params
        const searchParams = request.nextUrl.searchParams
        const download = searchParams.get('download') === 'true'

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        const company = await portfolioRepository.getCompanyByRequestId(requestId)

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        // Check if user has access to this company
        if (company.user_id !== user.id && company.organization_id !== user.user_metadata?.organization_id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        try {
            // First try to get download URLs from AWS API
            const downloadUrls = await awsApiService.getDownloadUrls(requestId)

            if (downloadUrls.pdfUrl) {
                if (download) {
                    // For download, redirect to AWS API URL
                    return NextResponse.redirect(downloadUrls.pdfUrl)
                } else {
                    // For preview, return the AWS API URL
                    return NextResponse.json({
                        pdf_url: downloadUrls.pdfUrl,
                        filename: company.pdf_filename || `${company.company_name}-report.pdf`,
                        file_size: company.pdf_file_size,
                        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
                        source: 'aws_api'
                    })
                }
            }
        } catch (awsError) {
            console.warn('AWS API download failed, falling back to S3:', awsError)
        }

        // Fallback to direct S3 access if AWS API fails or PDF not available there
        if (!company.pdf_s3_key || !company.pdf_filename) {
            return NextResponse.json({
                error: 'PDF report not available. Processing may still be in progress.'
            }, { status: 404 })
        }

        try {
            // Generate signed URL for PDF download from S3
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: company.pdf_s3_key,
                ResponseContentDisposition: download
                    ? `attachment; filename="${company.pdf_filename}"`
                    : `inline; filename="${company.pdf_filename}"`,
                ResponseContentType: 'application/pdf'
            })

            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 3600 // 1 hour
            })

            if (download) {
                // For download, redirect to signed URL
                return NextResponse.redirect(signedUrl)
            } else {
                // For preview, return the signed URL
                return NextResponse.json({
                    pdf_url: signedUrl,
                    filename: company.pdf_filename,
                    file_size: company.pdf_file_size,
                    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
                    source: 's3_direct'
                })
            }

        } catch (s3Error) {
            console.error('S3 error:', s3Error)
            return NextResponse.json(
                { error: 'Failed to access PDF file' },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('PDF download API error:', error)
        return NextResponse.json(
            { error: 'Failed to process PDF request' },
            { status: 500 }
        )
    }
}