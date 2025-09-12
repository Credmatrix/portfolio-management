/**
 * Region Extraction Utilities
 * 
 * Functions to extract and normalize region data from risk_analysis JSONB structure
 * with support for multiple address sources and fallback logic.
 * Updated to match actual data structure.
 */

import {
    RiskAnalysisData,
    parseRiskAnalysisData,
    normalizeStateName,
    safeExtract
} from './risk-analysis-extractors';

export interface RegionData {
    state: string | null;
    city: string | null;
    source: 'registered' | 'business' | 'unknown';
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Extracts region information from risk analysis data with multiple fallback sources
 */
export function extractRegionFromRiskAnalysis(riskAnalysis: any): RegionData {
    return safeExtract(
        () => {
            const parsedData = parseRiskAnalysisData(riskAnalysis);
            if (!parsedData) {
                return createEmptyRegionData();
            }

            // Try registered address first (higher priority)
            const registeredRegion = extractFromAddress(
                parsedData.companyData?.addresses?.registered_address,
                'registered'
            );

            if (registeredRegion.state) {
                return registeredRegion;
            }

            // Fallback to business address
            const businessRegion = extractFromAddress(
                parsedData.companyData?.addresses?.business_address,
                'business'
            );

            if (businessRegion.state) {
                return businessRegion;
            }

            // Try alternative paths in the data structure
            const alternativeRegion = extractFromAlternativePaths(parsedData);
            if (alternativeRegion.state) {
                return alternativeRegion;
            }

            return createEmptyRegionData();
        },
        createEmptyRegionData(),
        'extractRegionFromRiskAnalysis'
    );
}

/**
 * Extracts region data from a specific address object
 */
function extractFromAddress(
    address: any,
    source: 'registered' | 'business'
): RegionData {
    if (!address || typeof address !== 'object') {
        return createEmptyRegionData();
    }

    const state = normalizeStateName(address.state || '');
    const city = normalizeCity(address.city || '');

    // Determine confidence based on data quality
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (state && city) {
        confidence = 'high';
    } else if (state || city) {
        confidence = 'medium';
    }

    return {
        state: state || null,
        city: city || null,
        source,
        confidence
    };
}

/**
 * Tries to extract region data from alternative paths in the risk analysis structure
 */
function extractFromAlternativePaths(data: RiskAnalysisData): RegionData {
    // Check for state/city in other possible locations
    const alternativePaths = [
        data.companyData?.addresses,
        data.companyData?.company_info,
        data.addresses,
        data.location
    ];

    for (const pathData of alternativePaths) {
        if (pathData && typeof pathData === 'object') {
            const state = normalizeStateName(pathData.state || pathData.stateName || '');
            const city = normalizeCity(pathData.city || pathData.cityName || '');

            if (state || city) {
                return {
                    state: state || null,
                    city: city || null,
                    source: 'unknown',
                    confidence: state && city ? 'medium' : 'low'
                };
            }
        }
    }

    // Try to extract from full address strings
    return extractFromAddressString(data);
}

/**
 * Attempts to extract region data from full address strings using pattern matching
 */
function extractFromAddressString(data: RiskAnalysisData): RegionData {
    const addressStrings = [
        data.companyData?.addresses?.registered_address?.address_line_1,
        data.companyData?.addresses?.registered_address?.address_line_2,
        data.companyData?.addresses?.business_address?.address_line_1,
        data.companyData?.addresses?.business_address?.address_line_2,
    ].filter(Boolean);

    for (const addressString of addressStrings) {
        if (typeof addressString === 'string') {
            const extracted = parseAddressString(addressString);
            if (extracted.state || extracted.city) {
                return {
                    ...extracted,
                    source: 'unknown',
                    confidence: 'low'
                };
            }
        }
    }

    return createEmptyRegionData();
}

/**
 * Parses an address string to extract state and city information
 */
function parseAddressString(address: string): { state: string | null; city: string | null } {
    if (!address || typeof address !== 'string') {
        return { state: null, city: null };
    }

    const normalizedAddress = address.toLowerCase();

    // Common state patterns in addresses
    const statePatterns = [
        /maharashtra/i,
        /karnataka/i,
        /tamil nadu|tamilnadu/i,
        /uttar pradesh|uttarpradesh/i,
        /west bengal|westbengal/i,
        /andhra pradesh|andhrapradesh/i,
        /madhya pradesh|madhyapradesh/i,
        /gujarat/i,
        /rajasthan/i,
        /punjab/i,
        /haryana/i,
        /kerala/i,
        /odisha|orissa/i,
        /jharkhand/i,
        /chhattisgarh/i,
        /assam/i,
        /bihar/i,
        /goa/i,
        /delhi|new delhi/i,
        /telangana/i
    ];

    let detectedState: string | null = null;

    for (const pattern of statePatterns) {
        const match = address.match(pattern);
        if (match) {
            detectedState = normalizeStateName(match[0]);
            break;
        }
    }

    // Try to extract city (this is more complex and less reliable)
    let detectedCity: string | null = null;

    // Look for common city patterns
    const cityKeywords = ['city', 'nagar', 'pur', 'bad', 'ganj', 'garh'];
    const words = address.split(/[,\s]+/).filter(word => word.length > 2);

    for (const word of words) {
        if (cityKeywords.some(keyword => word.toLowerCase().includes(keyword))) {
            detectedCity = normalizeCity(word);
            break;
        }
    }

    return {
        state: detectedState,
        city: detectedCity
    };
}

/**
 * Normalizes city names to handle variations
 */
function normalizeCity(cityName: string): string {
    if (!cityName || typeof cityName !== 'string') {
        return '';
    }

    const normalized = cityName.trim();

    // Common city name mappings
    const cityMapping: Record<string, string> = {
        'mumbai': 'Mumbai',
        'bombay': 'Mumbai',
        'bangalore': 'Bengaluru',
        'bengaluru': 'Bengaluru',
        'calcutta': 'Kolkata',
        'kolkata': 'Kolkata',
        'madras': 'Chennai',
        'chennai': 'Chennai',
        'new delhi': 'New Delhi',
        'delhi': 'Delhi',
        'hyderabad': 'Hyderabad',
        'pune': 'Pune',
        'ahmedabad': 'Ahmedabad',
        'surat': 'Surat',
        'jaipur': 'Jaipur',
        'lucknow': 'Lucknow',
        'kanpur': 'Kanpur',
        'nagpur': 'Nagpur',
        'indore': 'Indore',
        'thane': 'Thane',
        'bhopal': 'Bhopal',
        'visakhapatnam': 'Visakhapatnam',
        'pimpri chinchwad': 'Pimpri-Chinchwad',
        'patna': 'Patna',
        'vadodara': 'Vadodara',
        'ghaziabad': 'Ghaziabad',
        'ludhiana': 'Ludhiana',
        'agra': 'Agra',
        'nashik': 'Nashik',
        'faridabad': 'Faridabad',
        'meerut': 'Meerut',
        'rajkot': 'Rajkot',
        'kalyan dombivali': 'Kalyan-Dombivli',
        'vasai virar': 'Vasai-Virar',
        'varanasi': 'Varanasi',
        'srinagar': 'Srinagar',
        'aurangabad': 'Aurangabad',
        'dhanbad': 'Dhanbad',
        'amritsar': 'Amritsar',
        'navi mumbai': 'Navi Mumbai',
        'allahabad': 'Prayagraj',
        'prayagraj': 'Prayagraj',
        'howrah': 'Howrah',
        'ranchi': 'Ranchi',
        'gwalior': 'Gwalior',
        'jabalpur': 'Jabalpur',
        'coimbatore': 'Coimbatore',
        'vijayawada': 'Vijayawada',
        'jodhpur': 'Jodhpur',
        'madurai': 'Madurai',
        'raipur': 'Raipur',
        'kota': 'Kota',
        'chandigarh': 'Chandigarh',
        'guwahati': 'Guwahati',
        'solapur': 'Solapur',
        'hubli dharwad': 'Hubli-Dharwad',
        'tiruchirappalli': 'Tiruchirappalli',
        'bareilly': 'Bareilly',
        'mysore': 'Mysuru',
        'mysuru': 'Mysuru',
        'tiruppur': 'Tiruppur',
        'gurgaon': 'Gurugram',
        'gurugram': 'Gurugram',
        'aligarh': 'Aligarh',
        'jalandhar': 'Jalandhar',
        'bhubaneswar': 'Bhubaneswar',
        'salem': 'Salem',
        'warangal': 'Warangal',
        'mira bhayandar': 'Mira-Bhayandar',
        'thiruvananthapuram': 'Thiruvananthapuram',
        'bhiwandi': 'Bhiwandi',
        'saharanpur': 'Saharanpur',
        'guntur': 'Guntur',
        'amravati': 'Amravati',
        'bikaner': 'Bikaner',
        'noida': 'Noida',
        'jamshedpur': 'Jamshedpur',
        'bhilai nagar': 'Bhilai',
        'cuttack': 'Cuttack',
        'firozabad': 'Firozabad',
        'kochi': 'Kochi',
        'cochin': 'Kochi',
        'bhavnagar': 'Bhavnagar',
        'dehradun': 'Dehradun',
        'durgapur': 'Durgapur',
        'asansol': 'Asansol',
        'nanded waghala': 'Nanded',
        'kolhapur': 'Kolhapur',
        'ajmer': 'Ajmer',
        'akola': 'Akola',
        'gulbarga': 'Kalaburagi',
        'kalaburagi': 'Kalaburagi',
        'jamnagar': 'Jamnagar',
        'ujjain': 'Ujjain',
        'loni': 'Loni',
        'siliguri': 'Siliguri',
        'jhansi': 'Jhansi',
        'ulhasnagar': 'Ulhasnagar',
        'nellore': 'Nellore',
        'jammu': 'Jammu',
        'sangli miraj kupwad': 'Sangli',
        'belgaum': 'Belagavi',
        'belagavi': 'Belagavi',
        'mangalore': 'Mangaluru',
        'mangaluru': 'Mangaluru',
        'ambattur': 'Ambattur',
        'tirunelveli': 'Tirunelveli',
        'malegaon': 'Malegaon',
        'gaya': 'Gaya',
        'jalgaon': 'Jalgaon',
        'udaipur': 'Udaipur',
        'maheshtala': 'Maheshtala'
    };

    const lowerNormalized = normalized.toLowerCase();
    return cityMapping[lowerNormalized] || normalized.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Creates an empty region data object
 */
function createEmptyRegionData(): RegionData {
    return {
        state: null,
        city: null,
        source: 'unknown',
        confidence: 'low'
    };
}

/**
 * Validates region data quality
 */
export function validateRegionData(regionData: RegionData): boolean {
    return regionData.state !== null || regionData.city !== null;
}

/**
 * Gets region display string for UI
 */
export function getRegionDisplayString(regionData: RegionData): string {
    if (!regionData.state && !regionData.city) {
        return 'Unknown';
    }

    if (regionData.state && regionData.city) {
        return `${regionData.city}, ${regionData.state}`;
    }

    return regionData.state || regionData.city || 'Unknown';
}

/**
 * Checks if two region data objects are equivalent
 */
export function areRegionsEquivalent(region1: RegionData, region2: RegionData): boolean {
    return region1.state === region2.state && region1.city === region2.city;
}