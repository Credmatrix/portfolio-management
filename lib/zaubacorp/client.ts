// lib/zaubacorp/client.ts
import { parse } from 'node-html-parser';
import { SearchFilter, CompanySearchResult, CompanyData } from './types';
import { ZaubaCorpError, SearchError, NetworkError } from './exceptions';

export class ZaubaCorpClient {
    private baseUrl = 'https://www.zaubacorp.com';
    private delay: number;

    constructor(delayBetweenRequests: number = 1.0) {
        this.delay = delayBetweenRequests;
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private cleanText(text: string): string {
        if (!text) return '';
        // Clean whitespace like Python's re.sub(r'\s+', ' ', text.strip())
        text = text.replace(/\s+/g, ' ').trim();
        // Clean email protection like Python's re.sub(r'\[email.*?protected\]', '[email protected]', text)
        text = text.replace(/\[email.*?protected\]/g, '[email protected]');
        return text;
    }

    private async searchCompaniesUrllib(query: string, filterType: SearchFilter): Promise<string | null> {
        try {
            const url = `${this.baseUrl}/typeahead`;

            // Prepare form data exactly like Python
            const formData = new URLSearchParams({
                'search': query,
                'filter': filterType
            });

            // Headers exactly matching Python urllib version
            const headers = {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/x-www-form-urlencoded',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData.toString()
            });

            if (response.ok) {
                return await response.text();
            }
            return null;

        } catch (error) {
            console.log(`urllib search error: ${error}`);
            return null;
        }
    }

    private async searchCompaniesRequests(query: string, filterType: SearchFilter): Promise<string | null> {
        try {
            const url = `${this.baseUrl}/typeahead`;

            const formData = new URLSearchParams({
                'search': query,
                'filter': filterType
            });

            // Headers exactly matching Python requests session
            const headers = {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData.toString()
            });

            if (response.ok) {
                return await response.text();
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            throw error;
        }
    }

    async searchCompanies(
        query: string,
        filterType: SearchFilter = SearchFilter.COMPANY,
        maxResults?: number
    ): Promise<CompanySearchResult[]> {
        try {
            await this.sleep(this.delay * 1000);

            // Try urllib method first (working method) - exactly like Python
            let responseText = await this.searchCompaniesUrllib(query, filterType);

            if (!responseText) {
                // Fallback to requests session if urllib fails - exactly like Python
                try {
                    responseText = await this.searchCompaniesRequests(query, filterType);
                } catch (error) {
                    throw new NetworkError(
                        `Both urllib and requests search methods failed. Last error: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            if (!responseText) {
                throw new SearchError("No response received from search API");
            }

            // Parse HTML response exactly like Python BeautifulSoup
            const root = parse(responseText);
            const divs = root.querySelectorAll('div.show');

            const results: CompanySearchResult[] = [];

            for (const div of divs) {
                try {
                    // Mimic CompanySearchResult.from_html_div(div) from Python
                    const companyId = div.getAttribute('id') || '';
                    const companyName = this.cleanText(div.text);

                    if (companyId && companyName) {
                        results.push({
                            id: companyId,
                            name: companyName
                        });

                        if (maxResults && results.length >= maxResults) {
                            break;
                        }
                    }
                } catch (error) {
                    // Continue like Python - skip failed results
                    continue;
                }
            }

            return results;

        } catch (error) {
            if (error instanceof NetworkError) {
                throw error;
            }
            throw new SearchError(`Search parsing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private extractTableData(table: any): Array<Record<string, any>> {
        if (!table) return [];

        const data: Array<Record<string, any>> = [];
        const rows = table.querySelectorAll('tr');

        for (const row of rows) {
            let rowData: Record<string, any> = {};
            const cells = row.querySelectorAll('td, th');

            if (cells.length === 2) {
                const key = this.cleanText(cells[0].text);
                const value = this.cleanText(cells[1].text);
                if (key && value) {
                    rowData = { [key]: value };
                }
            } else if (cells.length > 2) {
                rowData = {};
                cells.forEach((cell, i) => {
                    const cellText = this.cleanText(cell.text);
                    if (cellText) {
                        rowData[`column_${i}`] = cellText;
                    }
                });
            }

            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        }

        return data;
    }

    private extractRcSections(html: string): Record<string, any> {
        const root = parse(html);
        const rcSections: Record<string, any> = {};
        const rcDivs = root.querySelectorAll('div.rc');

        for (const div of rcDivs) {
            const titleElem = div.querySelector('h3.rh');
            let sectionTitle: string;

            if (titleElem) {
                sectionTitle = this.cleanText(titleElem.text);
            } else {
                sectionTitle = `section_${Object.keys(rcSections).length}`;
            }

            const sectionData: any = {};

            // Extract paragraphs exactly like Python
            const paragraphs = div.querySelectorAll('p.rp');
            if (paragraphs.length > 0) {
                const descriptions = paragraphs
                    .map(p => this.cleanText(p.text))
                    .filter(desc => desc);

                if (descriptions.length > 0) {
                    sectionData['descriptions'] = descriptions;
                }
            }

            // Extract tables exactly like Python
            const tables = div.querySelectorAll('table');
            if (tables.length > 0) {
                sectionData['tables'] = [];
                tables.forEach((table, i) => {
                    const tableData = this.extractTableData(table);
                    if (tableData.length > 0) {
                        const caption = table.querySelector('caption');
                        const captionText = caption
                            ? this.cleanText(caption.text)
                            : `table_${i}`;

                        sectionData['tables'].push({
                            'caption': captionText,
                            'data': tableData
                        });
                    }
                });
            }

            if (Object.keys(sectionData).length > 0) {
                rcSections[sectionTitle] = sectionData;
            }
        }

        return rcSections;
    }

    private async fetchHtmlUrllib(companyId: string): Promise<string | null> {
        try {
            const url = `${this.baseUrl}/${companyId}`;

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            };

            const response = await fetch(url, { headers });

            if (response.ok) {
                return await response.text();
            }
            return null;

        } catch (error) {
            return null;
        }
    }

    private async fetchHtml(companyId: string): Promise<string | null> {
        try {
            return await this.fetchHtmlUrllib(companyId);
        } catch (error) {
            return await this.fetchHtmlUrllib(companyId);
        }
    }

    async getCompanyData(companyId: string): Promise<CompanyData> {
        try {
            const htmlContent = await this.fetchHtml(companyId);

            if (!htmlContent) {
                return {
                    company_id: companyId,
                    rc_sections: {},
                    extraction_timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    success: false,
                    error_message: "Failed to fetch HTML content"
                };
            }

            const rcSections = this.extractRcSections(htmlContent);

            return {
                company_id: companyId,
                rc_sections: rcSections,
                extraction_timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                success: true
            };

        } catch (error) {
            return {
                company_id: companyId,
                rc_sections: {},
                extraction_timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                success: false,
                error_message: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async searchAndGetData(
        query: string,
        exactMatch: boolean = false,
        maxSearchResults: number = 5
    ): Promise<CompanyData[]> {
        try {
            let searchResults = await this.searchCompanies(query, SearchFilter.COMPANY, maxSearchResults);

            if (exactMatch) {
                searchResults = searchResults.filter(result =>
                    result.name.toLowerCase().includes(query.toLowerCase())
                );
            }

            const companyDataList: CompanyData[] = [];
            for (const result of searchResults) {
                const companyData = await this.getCompanyData(result.id);
                companyDataList.push(companyData);
            }

            return companyDataList;

        } catch (error) {
            throw new ZaubaCorpError(
                `Search and data extraction failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}