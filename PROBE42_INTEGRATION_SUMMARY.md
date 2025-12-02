# Probe42 Search Integration Summary

## Overview
Integrated Probe42 API as the **PRIMARY** search source for company data in the Credmatrix platform.

## Changes Made

### 1. API Route Updates (`app/api/company/search/route.ts`)

#### Added Probe42 Configuration
- **API Base URL**: `https://moola-axl0.credmatrix.ai/api/v1`
- **Authentication**: Bearer token authentication
- **Endpoint**: `/companies/search?name_starts_with={query}&limit={limit}`

#### Search Priority (Updated)
1. **Probe42 API** (PRIMARY) - Most comprehensive source
2. ClearTax API - PAN-based entities
3. Existing companies database
4. Manual entries

#### Entity Type Support
Probe42 returns three entity categories:
- **Companies** → Mapped to `private_limited` or `public_limited`
- **LLPs** → Mapped to `llp`
- **PNPs** (Partnerships) → Mapped to `partnership_registered`

#### New Helper Function
```typescript
determineEntityTypeFromProbe42(category: string, legalName?: string): EntityType
```
Maps Probe42 entity categories to internal entity types.

#### Match Score Boost
Probe42 results receive the highest match score boost (15 points) as the most reliable source.

### 2. Type Definition Updates (`types/manual-company.types.ts`)

Extended `CompanySearchResult.additional_info` to include:
- `bid?: string` - Probe42 business identifier
- `entity_category?: string` - Original Probe42 entity category

### 3. Response Format

Probe42 results include:
```typescript
{
  id: entity.bid || registrationNumber,
  name: entity.legal_name,
  entity_type: 'private_limited' | 'public_limited' | 'llp' | 'partnership_registered',
  registration_number: entity.cin || entity.llpin || entity.pnp_number,
  status: entity.status,
  data_sources: ['api', 'excel'],
  match_score: 90-115 (highest priority),
  match_reason: "Probe42 verified {CATEGORY} entity",
  additional_info: {
    bid: entity.bid,
    source: 'probe42',
    entity_category: entity.entity_category
  }
}
```

## API Response Structure

Probe42 API returns:
```json
{
  "success": true,
  "data": {
    "results": {
      "entities": {
        "companies": [...],
        "llps": [...],
        "pnps": [...]
      },
      "total_count": 10
    }
  }
}
```

## Error Handling

- Graceful fallback if Probe42 API fails
- Continues with other search sources (ClearTax, existing DB)
- Logs warnings for debugging without breaking the search flow

## Security Note

⚠️ **TODO**: Move `PROBE42_AUTH_TOKEN` to environment variables for production security.

## Testing

To test the integration:
```bash
curl -X GET "http://localhost:3000/api/company/search?query=Zetwerk&enhanced=true&limit=10" \
  -H "Authorization: Bearer {your-session-token}"
```

Expected behavior:
- Probe42 results appear first (highest match scores)
- Results include `bid` and `entity_category` in `additional_info`
- Match reasons indicate "Probe42 verified" source

## Benefits

1. **More Comprehensive Data**: Probe42 provides the most complete company information
2. **Better Match Quality**: Higher reliability scores for Probe42 results
3. **Multi-Entity Support**: Covers companies, LLPs, and partnerships in one API
4. **Faster Response**: Primary source reduces need for fallback searches
5. **Consistent Format**: Standardized entity data structure

## Next Steps

1. Move authentication token to environment variables
2. Add rate limiting for Probe42 API calls
3. Implement caching for frequently searched companies
4. Add monitoring for Probe42 API availability
5. Consider adding Probe42 company detail endpoint integration
