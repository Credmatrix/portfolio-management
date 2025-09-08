// lib/zaubacorp/types.ts
export enum SearchFilter {
    COMPANY = "company",
    DIRECTOR = "director",
    TRADEMARK = "trademark",
    ADDRESS = "company_by_address"
}

export interface CompanySearchResult {
    id: string;
    name: string;
}

export interface CompanyData {
    company_id: string;
    rc_sections: Record<string, any>;
    extraction_timestamp: string;
    success: boolean;
    error_message?: string;
}

export interface CompanySearchResponse {
    success: boolean;
    results: CompanySearchResult[];
    total_found: number;
    error_message?: string;
}

export interface CompanyDataResponse {
    success: boolean;
    company_id: string;
    rc_sections: Record<string, any>;
    extraction_timestamp: string;
    error_message?: string;
}