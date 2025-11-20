// Enhanced validation utilities for API processing workflow

export interface ValidationResult {
    isValid: boolean
    error?: string
    warnings?: string[]
    metadata?: Record<string, any>
}

/**
 * Validates Corporate Identity Number (CIN)
 * Format: LNNNNNKKYYYYPLCNNNNNN (21 characters)
 * L = Listing status (L/U)
 * NNNNN = Registration number
 * KK = State code
 * YYYY = Year of incorporation
 * P = Public/Private (P/B)
 * L = Listed/Unlisted (L/C)
 * C = Category (C for company)
 * NNNNNN = Sequence number
 */
export function validateCIN(cin: string): ValidationResult {
    if (!cin) {
        return { isValid: false, error: 'CIN is required' }
    }

    const cleanCin = cin.trim().toUpperCase()

    // Length check
    if (cleanCin.length !== 21) {
        return {
            isValid: false,
            error: 'CIN must be exactly 21 characters long'
        }
    }

    // Format validation
    const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[C]{1}[0-9]{6}$/
    if (!cinRegex.test(cleanCin)) {
        return {
            isValid: false,
            error: 'Invalid CIN format. Expected format: LNNNNNKKYYYYPLCNNNNNN'
        }
    }

    // Extract components for validation
    const listingStatus = cleanCin[0] // L or U
    const registrationNumber = cleanCin.substring(1, 6)
    const stateCode = cleanCin.substring(6, 8)
    const yearOfIncorporation = parseInt(cleanCin.substring(8, 12))
    const publicPrivate = cleanCin[12] // P or B
    const listedUnlisted = cleanCin[13] // L or C
    const category = cleanCin[14] // Should be C
    const sequenceNumber = cleanCin.substring(15, 21)

    const warnings: string[] = []

    // Validate year of incorporation
    const currentYear = new Date().getFullYear()
    if (yearOfIncorporation < 1850 || yearOfIncorporation > currentYear) {
        return {
            isValid: false,
            error: `Invalid year of incorporation: ${yearOfIncorporation}`
        }
    }

    // Validate state codes (basic validation)
    const validStateCodes = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DL', 'DN', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH',
        'KA', 'KL', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PY', 'PB', 'RJ', 'SK', 'TN',
        'TG', 'TR', 'UP', 'UT', 'WB'
    ]

    if (!validStateCodes.includes(stateCode)) {
        warnings.push(`Unusual state code: ${stateCode}`)
    }

    // Check listing status consistency
    if (listingStatus === 'L' && listedUnlisted === 'C') {
        warnings.push('Listed company marked as unlisted in CIN')
    }
    if (listingStatus === 'U' && listedUnlisted === 'L') {
        warnings.push('Unlisted company marked as listed in CIN')
    }

    return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
            listingStatus,
            registrationNumber,
            stateCode,
            yearOfIncorporation,
            publicPrivate: publicPrivate === 'P' ? 'Public' : 'Private',
            listedUnlisted: listedUnlisted === 'L' ? 'Listed' : 'Unlisted',
            sequenceNumber
        }
    }
}

/**
 * Validates Limited Liability Partnership Identification Number (LLPIN)
 * Format: XXX-NNNN (8 characters)
 * XXX = State code (3 letters)
 * NNNN = Sequential number (4 digits)
 */
export function validateLLPIN(llpin: string): ValidationResult {
    if (!llpin) {
        return { isValid: false, error: 'LLPIN is required' }
    }

    const cleanLlpin = llpin.trim().toUpperCase()

    // Length and format check
    if (cleanLlpin.length !== 8) {
        return {
            isValid: false,
            error: 'LLPIN must be exactly 8 characters long'
        }
    }

    const llpinRegex = /^[A-Z]{3}-[0-9]{4}$/
    if (!llpinRegex.test(cleanLlpin)) {
        return {
            isValid: false,
            error: 'Invalid LLPIN format. Expected format: XXX-NNNN'
        }
    }

    const stateCode = cleanLlpin.substring(0, 3)
    const sequenceNumber = cleanLlpin.substring(4, 8)

    // Validate state codes for LLP
    const validLLPStateCodes = [
        'AAP', 'AAR', 'AAS', 'ABR', 'ACH', 'ACT', 'ADL', 'ADN', 'AGA', 'AGJ', 'AHR', 'AHP', 'AJK', 'AJH',
        'AKA', 'AKL', 'ALD', 'AMP', 'AMH', 'AMN', 'AML', 'AMZ', 'ANL', 'AOR', 'APY', 'APB', 'ARJ', 'ASK', 'ATN',
        'ATG', 'ATR', 'AUP', 'AUT', 'AWB'
    ]

    const warnings: string[] = []
    if (!validLLPStateCodes.includes(stateCode)) {
        warnings.push(`Unusual LLP state code: ${stateCode}`)
    }

    return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
            stateCode,
            sequenceNumber
        }
    }
}

/**
 * Validates Permanent Account Number (PAN)
 * Format: AAAAA9999A (10 characters)
 * AAAAA = 5 alphabetic characters
 * 9999 = 4 numeric characters
 * A = 1 alphabetic check character
 */
export function validatePAN(pan: string): ValidationResult {
    if (!pan) {
        return { isValid: false, error: 'PAN is required' }
    }

    const cleanPan = pan.trim().toUpperCase()

    // Length check
    if (cleanPan.length !== 10) {
        return {
            isValid: false,
            error: 'PAN must be exactly 10 characters long'
        }
    }

    // Format validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(cleanPan)) {
        return {
            isValid: false,
            error: 'Invalid PAN format. Expected format: AAAAA9999A'
        }
    }

    // Extract fourth character for entity type validation
    const fourthChar = cleanPan[3]
    const entityTypes: Record<string, string> = {
        'P': 'Individual',
        'C': 'Company',
        'H': 'HUF',
        'F': 'Firm',
        'A': 'Association of Persons',
        'T': 'Trust',
        'B': 'Body of Individuals',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'G': 'Government',
        'K': 'Krishi'
    }

    const entityType = entityTypes[fourthChar]
    if (!entityType) {
        return {
            isValid: false,
            error: `Invalid entity type character: ${fourthChar}`
        }
    }

    return {
        isValid: true,
        metadata: {
            entityType,
            entityCode: fourthChar
        }
    }
}

/**
 * Validates CIN/LLPIN/PAN based on entity type and format
 */
export function validateCinLlpin(value: string, entityType?: string): ValidationResult {
    if (!value) {
        return { isValid: false, error: 'CIN/LLPIN/PAN is required' }
    }

    const cleanValue = value.trim().toUpperCase()

    // PAN validation (10 characters)
    if (cleanValue.length === 10) {
        return validatePAN(cleanValue)
    }

    // LLPIN validation (8 characters with dash)
    if (entityType === 'llp' || cleanValue.includes('-')) {
        return validateLLPIN(cleanValue)
    }

    // CIN validation (21 characters)
    return validateCIN(cleanValue)
}

/**
 * Validates GST Identification Number (GSTIN)
 * Format: NNAAAANNNNNANNN (15 characters)
 * NN = State code (2 digits)
 * AAAA = PAN of legal entity (first 10 chars of PAN)
 * NNNNN = Entity number + check digit + default 'Z'
 */
export function validateGSTIN(gstin: string): ValidationResult {
    if (!gstin) {
        return { isValid: false, error: 'GSTIN is required' }
    }

    const cleanGstin = gstin.trim().toUpperCase()

    // Length check
    if (cleanGstin.length !== 15) {
        return {
            isValid: false,
            error: 'GSTIN must be exactly 15 characters long'
        }
    }

    // Format validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/
    if (!gstinRegex.test(cleanGstin)) {
        return {
            isValid: false,
            error: 'Invalid GSTIN format'
        }
    }

    const stateCode = cleanGstin.substring(0, 2)
    const panPortion = cleanGstin.substring(2, 12)
    const entityNumber = cleanGstin[12]
    const checkDigit = cleanGstin[13]
    const defaultZ = cleanGstin[14]

    // Validate state code
    const validGSTStateCodes = [
        '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15',
        '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
        '31', '32', '33', '34', '35', '36', '37', '38', '96', '97', '99'
    ]

    if (!validGSTStateCodes.includes(stateCode)) {
        return {
            isValid: false,
            error: `Invalid GST state code: ${stateCode}`
        }
    }

    // Validate PAN portion
    const panValidation = validatePAN(panPortion)
    if (!panValidation.isValid) {
        return {
            isValid: false,
            error: `Invalid PAN portion in GSTIN: ${panValidation.error}`
        }
    }

    return {
        isValid: true,
        metadata: {
            stateCode,
            panPortion,
            entityNumber,
            checkDigit,
            entityType: panValidation.metadata?.entityType
        }
    }
}

/**
 * Determines processing eligibility based on entity type and identifiers
 */
export function determineProcessingEligibility(
    entityType: string,
    cin?: string,
    llpin?: string,
    pan?: string
): {
    apiEligible: boolean
    excelEligible: boolean
    manualRequired: boolean
    reasons: string[]
} {
    const reasons: string[] = []
    let apiEligible = false
    let excelEligible = true
    let manualRequired = false

    // API eligibility based on entity type and identifiers
    const corporateTypes = ['private_limited', 'public_limited', 'llp']
    const nonCorporateTypes = ['proprietorship', 'partnership']

    if (corporateTypes.includes(entityType)) {
        if (entityType === 'llp' && llpin) {
            const llpinValidation = validateLLPIN(llpin)
            if (llpinValidation.isValid) {
                apiEligible = true
                reasons.push('Valid LLPIN provided for LLP')
            } else {
                reasons.push(`Invalid LLPIN: ${llpinValidation.error}`)
            }
        } else if ((entityType === 'private_limited' || entityType === 'public_limited')) {
            if (cin) {
                const cinValidation = validateCIN(cin)
                if (cinValidation.isValid) {
                    apiEligible = true
                    reasons.push('Valid CIN provided for company')
                } else {
                    reasons.push(`Invalid CIN: ${cinValidation.error}`)
                }
            }
            if (pan) {
                const panValidation = validatePAN(pan)
                if (panValidation.isValid) {
                    apiEligible = true
                    reasons.push('Valid PAN provided for company')
                } else {
                    reasons.push(`Invalid PAN: ${panValidation.error}`)
                }
            }
        } else {
            reasons.push('Missing required identifier for API processing')
        }
    } else if (nonCorporateTypes.includes(entityType)) {
        // Non-corporate entities can use PAN for limited API processing
        if (pan) {
            const panValidation = validatePAN(pan)
            if (panValidation.isValid) {
                apiEligible = true
                reasons.push('Valid PAN provided for non-corporate entity')
            } else {
                reasons.push(`Invalid PAN: ${panValidation.error}`)
            }
        } else {
            reasons.push('PAN required for API processing of non-corporate entities')
            manualRequired = true
        }
    } else {
        reasons.push('Entity type not eligible for API processing')
        manualRequired = true
    }

    // Excel eligibility (generally available for all types)
    if (!apiEligible) {
        reasons.push('Excel upload available as alternative')
    }

    // Manual entry (always available as fallback)
    if (!apiEligible && !excelEligible) {
        manualRequired = true
        reasons.push('Manual entry required')
    }

    return {
        apiEligible,
        excelEligible,
        manualRequired,
        reasons
    }
}
