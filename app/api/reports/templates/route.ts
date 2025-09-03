import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: 'portfolio' | 'risk' | 'compliance' | 'financial' | 'custom';
    sections: string[];
    defaultFormat: 'pdf' | 'excel' | 'csv';
    isBuiltIn: boolean;
    createdAt: string;
    createdBy: string;
    usageCount: number;
    lastUsed?: string;
}

export async function GET(request: NextRequest) {
    // try {
    //     const supabase = createClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     // Fetch templates from database
    //     const { data: customTemplates, error } = await supabase
    //         .from('report_templates')
    //         .select('*')
    //         .eq('user_id', user.id)
    //         .order('created_at', { ascending: false });

    //     if (error) {
    //         console.error('Error fetching templates:', error);
    //     }

    //     // Combine built-in templates with custom templates
    //     const builtInTemplates = getBuiltInTemplates();
    //     const allTemplates = [...builtInTemplates, ...(customTemplates || [])];

    //     return NextResponse.json(allTemplates);

    // } catch (error) {
    //     console.error('Error in templates GET:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// export async function POST(request: NextRequest) {
//     try {
//         const supabase = createClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const templateData = await request.json();

//         // Validate required fields
//         if (!templateData.name || !templateData.sections || templateData.sections.length === 0) {
//             return NextResponse.json(
//                 { error: 'Missing required fields: name and sections' },
//                 { status: 400 }
//             );
//         }

//         // Generate unique template ID
//         const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//         // Create template record
//         const template = {
//             id: templateId,
//             user_id: user.id,
//             name: templateData.name,
//             description: templateData.description || '',
//             category: templateData.category || 'custom',
//             sections: templateData.sections,
//             default_format: templateData.defaultFormat || 'pdf',
//             is_built_in: false,
//             created_at: new Date().toISOString(),
//             created_by: user.email || user.id,
//             usage_count: 0,
//             updated_at: new Date().toISOString()
//         };

//         const { error: insertError } = await supabase
//             .from('report_templates')
//             .insert(template);

//         if (insertError) {
//             console.error('Error creating template:', insertError);
//             return NextResponse.json(
//                 { error: 'Failed to create template' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             id: templateId,
//             message: 'Template created successfully'
//         });

//     } catch (error) {
//         console.error('Error in templates POST:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// function getBuiltInTemplates(): ReportTemplate[] {
//     return [
//         {
//             id: 'portfolio-overview',
//             name: 'Portfolio Overview Report',
//             description: 'Comprehensive portfolio analysis with risk distribution and key metrics',
//             category: 'portfolio',
//             sections: ['executive-summary', 'portfolio-overview', 'risk-distribution', 'industry-breakdown', 'top-performers'],
//             defaultFormat: 'pdf',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 45,
//             lastUsed: '2024-01-15T10:30:00Z'
//         },
//         {
//             id: 'risk-assessment',
//             name: 'Risk Assessment Report',
//             description: 'Detailed risk analysis with parameter scoring and compliance status',
//             category: 'risk',
//             sections: ['risk-distribution', 'parameter-analysis', 'high-risk-companies', 'compliance-status', 'recommendations'],
//             defaultFormat: 'pdf',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 32,
//             lastUsed: '2024-01-14T14:20:00Z'
//         },
//         {
//             id: 'compliance-report',
//             name: 'Compliance Status Report',
//             description: 'GST and EPFO compliance analysis with regulatory insights',
//             category: 'compliance',
//             sections: ['compliance-status', 'gst-analysis', 'epfo-analysis', 'recommendations'],
//             defaultFormat: 'excel',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 28,
//             lastUsed: '2024-01-13T09:15:00Z'
//         },
//         {
//             id: 'financial-analysis',
//             name: 'Financial Performance Report',
//             description: 'Multi-year financial analysis with peer benchmarking',
//             category: 'financial',
//             sections: ['financial-summary', 'trend-analysis', 'peer-comparison', 'recommendations'],
//             defaultFormat: 'pdf',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 19,
//             lastUsed: '2024-01-12T16:45:00Z'
//         },
//         {
//             id: 'executive-summary',
//             name: 'Executive Summary Report',
//             description: 'High-level portfolio overview for executive stakeholders',
//             category: 'portfolio',
//             sections: ['executive-summary', 'top-performers', 'high-risk-companies', 'recommendations'],
//             defaultFormat: 'pdf',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 15,
//             lastUsed: '2024-01-11T08:20:00Z'
//         },
//         {
//             id: 'regulatory-compliance',
//             name: 'Regulatory Compliance Report',
//             description: 'Comprehensive compliance analysis for regulatory submissions',
//             category: 'compliance',
//             sections: ['compliance-status', 'gst-analysis', 'epfo-analysis', 'audit-qualifications', 'directors-analysis'],
//             defaultFormat: 'excel',
//             isBuiltIn: true,
//             createdAt: '2024-01-01T00:00:00Z',
//             createdBy: 'System',
//             usageCount: 12,
//             lastUsed: '2024-01-10T15:45:00Z'
//         }
//     ];
// }