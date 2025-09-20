// Simple test script to verify the enhanced search functionality
// Run with: node test-search-integration.js

const testSearchAPI = async () => {
    const baseUrl = 'http://localhost:3000'; // Adjust as needed
    
    console.log('Testing Enhanced Company Search API...\n');
    
    // Test 1: Enhanced search with ClearTax integration
    console.log('1. Testing enhanced search with ClearTax integration:');
    try {
        const response = await fetch(`${baseUrl}/api/company/search?query=Adversize&enhanced=true&include_suggestions=true&include_data_sources=true`);
        const data = await response.json();
        
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log(`Found ${data.results?.length || 0} results`);
        console.log(`Data sources: ${JSON.stringify(data.data_sources)}`);
        console.log('---\n');
    } catch (error) {
        console.error('Error in enhanced search:', error);
    }
    
    // Test 2: Legacy search (backward compatibility)
    console.log('2. Testing legacy search (backward compatibility):');
    try {
        const response = await fetch(`${baseUrl}/api/company/search?query=Adversize&filter_type=company&max_results=5`);
        const data = await response.json();
        
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('---\n');
    } catch (error) {
        console.error('Error in legacy search:', error);
    }
    
    // Test 3: Data status check with PAN
    console.log('3. Testing data status check with PAN:');
    try {
        const response = await fetch(`${baseUrl}/api/company/data-status?pan=GAIPS2295M`);
        const data = await response.json();
        
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('---\n');
    } catch (error) {
        console.error('Error in data status check:', error);
    }
};

// Run the test if this file is executed directly
if (require.main === module) {
    testSearchAPI().catch(console.error);
}

module.exports = { testSearchAPI };