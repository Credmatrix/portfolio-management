/**
 * Utility functions for generating and parsing company slugs
 * Format: company-name-pan (e.g., "techcorp-solutions-abcde1234f")
 */

export function generateCompanySlug(companyName: string, pan?: string, cin?: string): string {
    // Use PAN if available, otherwise use CIN, otherwise use company name only
    const identifier = pan || cin || '';

    // Clean company name: remove special characters, convert to lowercase, replace spaces with hyphens
    const cleanName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Clean identifier
    const cleanIdentifier = identifier
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    return cleanIdentifier ? `${cleanName}-${cleanIdentifier}` : cleanName;
}

export function parseCompanySlug(slug: string): { companyName: string; identifier: string } {
    const parts = slug.split('-');

    // The last part should be the PAN/CIN if it exists
    // PAN format: 10 characters (5 letters, 4 digits, 1 letter)
    // CIN format: 21 characters
    const lastPart = parts[parts.length - 1];

    // Check if last part looks like PAN (10 chars) or CIN (21 chars)
    const isPanOrCin = /^[a-z0-9]{10}$/.test(lastPart) || /^[a-z0-9]{21}$/.test(lastPart);

    if (isPanOrCin) {
        const identifier = lastPart.toUpperCase();
        const companyName = parts.slice(0, -1).join('-');
        return { companyName, identifier };
    } else {
        // No identifier found, entire slug is company name
        return { companyName: slug, identifier: '' };
    }
}

export function matchCompanyBySlug(
    slug: string,
    companyName: string,
    pan?: string,
    cin?: string
): boolean {
    const { companyName: slugCompanyName, identifier: slugIdentifier } = parseCompanySlug(slug);

    // Clean the actual company name for comparison
    const cleanActualName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if company names match
    const nameMatches = cleanActualName === slugCompanyName;

    // Check if identifier matches (PAN or CIN)
    const identifierMatches = !slugIdentifier ||
        slugIdentifier === (pan || '').toUpperCase() ||
        slugIdentifier === (cin || '').toUpperCase();

    return nameMatches && identifierMatches;
}