# API Processing Implementation Summary

## Overview
Implemented a new API-based processing option for the upload page that allows users to process company data without uploading files, using existing comprehensive data or fetching fresh data from external APIs.

## Key Features

### 1. Dual Processing Options
- **File Upload**: Traditional document upload and processing
- **API Processing**: Process using comprehensive company data from database or external APIs

### 2. Smart Data Management
- Checks if company data exists in local database with `comprehensive_data`
- If data exists: Uses cached data for faster processing
- If data doesn't exist: Fetches fresh data from external Moola API
- Shows data age and source information to users

### 3. Enhanced User Experience
- Real-time data availability checking
- Clear indication of processing method (cached vs fresh API fetch)
- Data age display for transparency
- Streamlined workflow from company search to processing

## Implementation Details

### New API Routes

#### `/api/company/process` (POST)
- Main processing endpoint
- Handles both cached data and fresh API fetch scenarios
- Creates document processing request
- Sends SQS message for background processing

**Request Body:**
```json
{
  "cin": "U70109MH2021PTC366141",
  "industry": "manufacturing",
  "model_type": "without_banking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "status": "processing",
    "message": "Processing started with existing company data",
    "has_existing_data": true
  }
}
```

#### `/api/company/data-status` (GET)
- Checks company data availability in local database
- Returns data age and processing method information

**Query Parameters:**
- `cin`: Company CIN number

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "has_comprehensive_data": true,
    "data_cached_at": "2025-01-18T10:30:00Z",
    "data_age_days": 5,
    "processing_method": "existing_data"
  }
}
```

### New Components

#### `ApiProcessing` Component
- Handles API-based processing workflow
- Shows data availability status
- Configures industry and model type
- Initiates processing and tracks results

**Key Features:**
- Real-time data status checking
- Visual indicators for data source and age
- Processing configuration options
- Error handling and user feedback

### Updated Components

#### Upload Page (`app/(dashboard)/upload/page.tsx`)
- Added new "API Processing" tab
- Enhanced company search workflow
- Dual processing options after company selection
- Integrated API processing with existing queue system

### External API Integration

#### Moola API Integration
- **Data Status Check**: `/companies/{cin}/data-status`
- **Comprehensive Details**: `/companies/{cin}/comprehensive-details`
- Uses Supabase JWT token for authentication
- Handles API errors gracefully

#### SQS Integration
- Sends processing requests to AWS SQS queue
- Message format compatible with existing processing pipeline
- Includes request tracking and metadata

### Database Schema Usage

#### Companies Table
- `comprehensive_data`: Stores fetched company data
- `comprehensive_data_cached_at`: Tracks data freshness
- `data_status`: Stores API status information
- `status_cached_at`: Tracks status check timestamp

#### Document Processing Requests Table
- Creates processing request for API-based processing
- Uses special filename "API_PROCESSING" for identification
- Tracks processing status and results

## Configuration

### Environment Variables
```bash
# SQS Configuration
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/012509421224/credmatrix-probe-api-processing-dev

# External API Configuration
MOOLA_API_BASE_URL=https://moola-axl1.credmatrix.ai/api/v1

# AWS Configuration (existing)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### Dependencies Added
- `@aws-sdk/client-sqs`: For SQS message sending
- `uuid`: For generating request IDs

## User Workflow

### API Processing Flow
1. **Company Search**: User searches and selects a company
2. **Data Status Check**: System checks data availability automatically
3. **Processing Options**: User chooses between API processing or file upload
4. **Configuration**: User selects industry type and model type
5. **Processing**: System either uses cached data or fetches fresh data
6. **Queue Tracking**: Processing request appears in queue for monitoring

### Data Processing Logic
```
Company Selected
    ↓
Check Local Database
    ↓
Has comprehensive_data? 
    ├─ YES → Use Cached Data → Send SQS Message
    └─ NO → Check API Status → Fetch Fresh Data → Update Database → Send SQS Message
```

## Benefits

### For Users
- **Faster Processing**: No file upload required
- **Data Transparency**: Clear indication of data source and age
- **Streamlined Workflow**: Direct from company search to processing
- **Flexibility**: Choice between file upload and API processing

### For System
- **Efficient Data Usage**: Leverages cached data when available
- **Reduced API Calls**: Only fetches fresh data when needed
- **Consistent Processing**: Uses same backend pipeline for all processing
- **Better Tracking**: Full audit trail of data sources and processing

## Error Handling

### API Processing Errors
- Network failures during external API calls
- Authentication issues with Moola API
- SQS message sending failures
- Database update failures

### User Feedback
- Clear error messages for different failure scenarios
- Loading states during data checks and processing
- Success confirmation with request tracking information

## Future Enhancements

### Potential Improvements
1. **Data Refresh Options**: Allow users to force fresh data fetch
2. **Batch Processing**: Process multiple companies via API
3. **Data Quality Indicators**: Show data completeness scores
4. **Processing Preferences**: Save user's preferred processing method
5. **Cost Tracking**: Monitor API usage and costs per user

### Monitoring and Analytics
- Track API vs file upload usage patterns
- Monitor data freshness and cache hit rates
- Analyze processing success rates by method
- User preference analytics

## Testing Considerations

### Test Scenarios
1. **Cached Data Processing**: Company with existing comprehensive_data
2. **Fresh Data Fetch**: Company without cached data
3. **API Failures**: External API unavailable or returns errors
4. **Authentication Issues**: Invalid or expired JWT tokens
5. **SQS Failures**: Queue unavailable or message sending fails

### Integration Testing
- End-to-end processing workflow
- External API integration
- SQS message handling
- Database consistency checks

This implementation provides a robust, user-friendly API processing option that enhances the existing upload workflow while maintaining compatibility with the current processing pipeline.