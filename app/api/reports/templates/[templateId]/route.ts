import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
) {
    // try {
    //     const supabase = createServerSupabaseClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     const { templateId } = await params;

    //     // Check if it's a built-in template
    //     const builtInTemplate = getBuiltInTemplate(templateId);
    //     if (builtInTemplate) {
    //         return NextResponse.json(builtInTemplate);
    //     }

    //     // Fetch custom template from database
    //     const { data: template, error } = await supabase
    //         .from('report_templates')
    //         .select('*')
    //         .eq('id', templateId)
    //         .eq('user_id', user.id)
    //         .single();

    //     if (error || !template) {
    //         return NextResponse.json(
    //             { error: 'Template not found' },
    //             { status: 404 }
    //         );
    //     }

    //     return NextResponse.json(template);

    // } catch (error) {
    //     console.error('Error fetching template:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// export async function PUT(
//     request: NextRequest,
//     { params }: { params: Promise<{ templateId: string }> }
// ) {
//     try {
//         const supabase = createServerSupabaseClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { templateId } = await params;
//         const templateData = await request.json();

//         // Check if it's a built-in template (cannot be modified)
//         const builtInTemplate = getBuiltInTemplate(templateId);
//         if (builtInTemplate) {
//             return NextResponse.json(
//                 { error: 'Built-in templates cannot be modified' },
//                 { status: 403 }
//             );
//         }

//         // Validate required fields
//         if (!templateData.name || !templateData.sections || templateData.sections.length === 0) {
//             return NextResponse.json(
//                 { error: 'Missing required fields: name and sections' },
//                 { status: 400 }
//             );
//         }

//         // Update template
//         const { error: updateError } = await supabase
//             .from('report_templates')
//             .update({
//                 name: templateData.name,
//                 description: templateData.description || '',
//                 category: templateData.category || 'custom',
//                 sections: templateData.sections,
//                 default_format: templateData.defaultFormat || 'pdf',
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', templateId)
//             .eq('user_id', user.id);

//         if (updateError) {
//             console.error('Error updating template:', updateError);
//             return NextResponse.json(
//                 { error: 'Failed to update template' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: 'Template updated successfully'
//         });

//     } catch (error) {
//         console.error('Error updating template:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: Promise<{ templateId: string }> }
// ) {
//     try {
//         const supabase = createServerSupabaseClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { templateId } = await params;

//         // Check if it's a built-in template (cannot be deleted)
//         const builtInTemplate = getBuiltInTemplate(templateId);
//         if (builtInTemplate) {
//             return NextResponse.json(
//                 { error: 'Built-in templates cannot be deleted' },
//                 { status: 403 }
//             );
//         }

//         // Delete template
//         const { error: deleteError } = await supabase
//             .from('report_templates')
//             .delete()
//             .eq('id', templateId)
//             .eq('user_id', user.id);

//         if (deleteError) {
//             console.error('Error deleting template:', deleteError);
//             return NextResponse.json(
//                 { error: 'Failed to delete template' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: 'Template deleted successfully'
//         });

//     } catch (error) {
//         console.error('Error deleting template:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: Promise<{ templateId: string }> }
// ) {
//     try {
//         const supabase = createServerSupabaseClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { templateId } = await params;
//         const { usageCount } = await request.json();

//         // Update usage count for analytics
//         const { error: updateError } = await supabase
//             .from('report_templates')
//             .update({
//                 usage_count: usageCount,
//                 last_used: new Date().toISOString(),
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', templateId)
//             .eq('user_id', user.id);

//         if (updateError) {
//             console.error('Error updating template usage:', updateError);
//             return NextResponse.json(
//                 { error: 'Failed to update template usage' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: 'Template usage updated successfully'
//         });

//     } catch (error) {
//         console.error('Error updating template usage:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// function getBuiltInTemplate(templateId: string) {
//     const builtInTemplates = [
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
//         }
//     ];

//     return builtInTemplates.find(template => template.id === templateId);
// }