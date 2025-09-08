// lib/zaubacorp/exceptions.ts
export class ZaubaCorpError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ZaubaCorpError';
    }
}

export class SearchError extends ZaubaCorpError {
    constructor(message: string) {
        super(message);
        this.name = 'SearchError';
    }
}

export class NetworkError extends ZaubaCorpError {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}