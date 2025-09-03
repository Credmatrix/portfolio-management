import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

// Supported file types for portfolio document processing
const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Industry options for portfolio companies
const SUPPORTED_INDUSTRIES = [
    'Manufacturing',
    'Services',
    'Trading',
    'Construction',
    'Real Estate',
    'Healthcare',
    'Education',
    'Technology',
    'Agriculture',
    'Transportation',
    'Energy',
    'Financial Services',
    'Retail',
    'Hospitality',
    'Media',
    'Telecommunications',
    'Pharmaceuticals',
    'Textiles',
    'Food & Beverages',
    'Chemicals',
    'Metals & Mining',
    'Automotive',
    'Electronics',
    'Infrastructure',
    'Logistics',
    'Other'
]

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const contentType = request.headers.get('content-type')

        // Handle both form data (legacy) and JSON (new AWS integration)
        let requestData: any
        if (contentType?.includes('application/json')) {
            requestData = await request.json()
        } else {
            const formData = await request.formData()
            requestData = {
                file: formData.get('file') as File,
                industry: formData.get('industry') as string,
                model_type: formData.get('model_type') as string,
                company_name: formData.get('company_name') as string,
                description: formData.get('description') as string
            }
        }

        const {
            file,
            industry,
            model_type: modelType,
            company_name: companyName,
            description,
            request_id: requestId,
            original_filename,
            file_size
        } = requestData

        // Validation
        if (!companyName || companyName.trim().length < 2) {
            return NextResponse.json({ error: 'Company name is required (minimum 2 characters)' }, { status: 400 })
        }

        if (!industry || !SUPPORTED_INDUSTRIES.includes(industry)) {
            return NextResponse.json({
                error: 'Valid industry is required',
                supported_industries: SUPPORTED_INDUSTRIES
            }, { status: 400 })
        }

        if (!modelType || !['with_banking', 'without_banking'].includes(modelType)) {
            return NextResponse.json({
                error: 'Valid model type is required (with_banking or without_banking)'
            }, { status: 400 })
        }

        // For AWS integration workflow, we don't have the file directly
        if (file) {
            // Legacy file upload validation
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({
                    error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
                }, { status: 400 })
            }

            if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
                return NextResponse.json({
                    error: 'Unsupported file type. Please upload PDF, Excel, CSV, or ZIP files.',
                    supported_types: ['PDF', 'Excel (.xlsx, .xls)', 'CSV', 'ZIP']
                }, { status: 400 })
            }
        } else if (!requestId) {
            return NextResponse.json({ error: 'Either file or request_id is required' }, { status: 400 })
        }

        // Check for duplicate company name in user's portfolio
        const { data: existingCompany } = await supabase
            .from('document_processing_requests')
            .select('company_name, request_id')
            .eq('user_id', user.id)
            .eq('company_name', companyName.trim())
            .single()

        if (existingCompany) {
            return NextResponse.json({
                error: 'A company with this name already exists in your portfolio',
                existing_request_id: existingCompany.request_id
            }, { status: 409 })
        }

        // Generate unique identifiers or use provided ones
        const finalRequestId = requestId || `REQ${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        const fileId = uuidv4()
        const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')

        let s3Key: string
        let s3FolderPath: string
        let fileName: string
        let fileSize: number

        if (file) {
            // Legacy file upload to S3
            fileName = file.name
            fileSize = file.size
            s3Key = `portfolio/${user.id}/${timestamp}/${sanitizedCompanyName}/${fileId}/${file.name}`
            s3FolderPath = `portfolio/${user.id}/${timestamp}/${sanitizedCompanyName}/${fileId}`

            try {
                // Upload to S3 with enhanced metadata
                const buffer = Buffer.from(await file.arrayBuffer())
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: file.type,
                    Metadata: {
                        'user-id': user.id,
                        'request-id': finalRequestId,
                        'company-name': companyName,
                        'industry': industry,
                        'model-type': modelType,
                        'upload-timestamp': new Date().toISOString(),
                        'original-filename': file.name,
                        'file-size': file.size.toString()
                    },
                    ServerSideEncryption: 'AES256' // Encrypt at rest
                }))
            } catch (s3Error) {
                console.error('S3 upload error:', s3Error)
                return NextResponse.json({
                    error: 'Failed to upload file to secure storage'
                }, { status: 500 })
            }
        } else {
            // AWS integration workflow - file already uploaded
            fileName = original_filename || 'unknown'
            fileSize = file_size || 0
            s3Key = `aws-integration/${finalRequestId}/${fileName}`
            s3FolderPath = `aws-integration/${finalRequestId}`
        }

        // Create database entry with enhanced data
        const { data, error } = await supabase
            .from('document_processing_requests')
            .insert({
                request_id: finalRequestId,
                user_id: user.id,
                organization_id: user.user_metadata?.organization_id || null,
                original_filename: fileName,
                company_name: companyName.trim(),
                file_size: fileSize,
                file_extension: fileName.split('.').pop()?.toLowerCase() || '',
                s3_upload_key: s3Key,
                s3_folder_path: s3FolderPath,
                industry,
                model_type: modelType as any,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                retry_count: 0,
                processing_summary: {
                    description: description || null,
                    upload_source: requestId ? 'aws_integration' : 'portfolio_dashboard',
                    file_type: file?.type || 'unknown',
                    upload_ip: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({
                error: 'Failed to create processing request in database'
            }, { status: 500 })
        }

        // Log the upload for audit purposes
        // try {
        //     await supabase
        //         .from('audit_logs')
        //         .insert({
        //             user_id: user.id,
        //             action: 'portfolio_document_upload',
        //             resource_type: 'document_processing_request',
        //             resource_id: data.id,
        //             details: {
        //                 request_id: requestId,
        //                 company_name: companyName,
        //                 filename: file.name,
        //                 file_size: file.size,
        //                 industry,
        //                 model_type: modelType,
        //                 description: description || null
        //             },
        //             ip_address: request.headers.get('x-forwarded-for') || null,
        //             user_agent: request.headers.get('user-agent') || null
        //         })
        // } catch (auditError: any) {
        //     console.warn('Audit log failed:', auditError)
        // }

        // TODO: Trigger document processing pipeline
        // This would typically involve:
        // 1. Adding to a processing queue (Redis/SQS/Bull)
        // 2. Triggering a background job/worker
        // 3. Updating status to 'processing'
        // 4. Sending notification when complete
        // await triggerPortfolioDocumentProcessing(data.id, requestId)

        return NextResponse.json({
            success: true,
            message: 'Document uploaded successfully and queued for processing',
            data: {
                id: data.id,
                request_id: finalRequestId,
                company_name: companyName,
                status: data.status,
                filename: fileName,
                file_size: fileSize,
                industry,
                model_type: modelType,
                submitted_at: data.submitted_at,
                estimated_processing_time: '15-30 minutes' // Provide user expectation
            }
        })

    } catch (error) {
        console.error('Portfolio upload error:', error)
        return NextResponse.json({
            error: 'Internal server error during portfolio document upload'
        }, { status: 500 })
    }
}

// GET endpoint to retrieve upload status and history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = supabase
            .from('document_processing_requests')
            .select(`
                id,
                request_id,
                company_name,
                original_filename,
                file_size,
                industry,
                model_type,
                status,
                submitted_at,
                processing_started_at,
                completed_at,
                error_message,
                retry_count
            `)
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false })
            .range(offset, offset + limit - 1)

        // if (status) {
        //     query = query.eq('status', status)
        // }

        const { data: uploads, error, count } = await query

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({
                error: 'Failed to fetch upload history'
            }, { status: 500 })
        }

        return NextResponse.json({
            uploads: uploads || [],
            total_count: count || 0,
            limit,
            offset,
            has_more: (count || 0) > offset + limit
        })

    } catch (error) {
        console.error('Upload history error:', error)
        return NextResponse.json({
            error: 'Failed to retrieve upload history'
        }, { status: 500 })
    }
}