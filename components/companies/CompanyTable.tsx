'use client';

import { Building2, Eye, Edit, Trash2, MapPin, Calendar, CreditCard } from 'lucide-react';
import { CompanyListItem } from '@/types/company.types';
import { generateCompanySlug } from '@/lib/utils/company-slug';
import Link from 'next/link';

interface CompanyTableProps {
    companies: CompanyListItem[];
    loading: boolean;
}

export function CompanyTable({ companies, loading }: CompanyTableProps) {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'review':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'suspended':
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRatingColor = (rating?: string) => {
        if (!rating) return 'text-gray-600';
        if (rating.startsWith('AA') || rating.startsWith('A+')) return 'text-green-600';
        if (rating.startsWith('A') || rating.startsWith('BBB+')) return 'text-blue-600';
        if (rating.startsWith('BBB')) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else {
            return `₹${amount.toFixed(2)}`;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                            <div className="ml-4">
                                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                                <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end space-x-2">
                                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Company
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Industry
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credit Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Risk Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credit Limit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {/* <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div> */}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {company.name}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                {company.cin && <span>CIN: {company.cin}</span>}
                                                {company.pan && <span>PAN: {company.pan}</span>}
                                                {company.requestCount > 1 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {company.requestCount} requests
                                                    </span>
                                                )}
                                            </div>
                                            {company.location && (
                                                <div className="text-xs text-gray-400 flex items-center mt-1">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {company.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {company.industry}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-sm font-semibold ${getRatingColor(company.creditRating)}`}>
                                        {company.creditRating || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {company.riskScore ? (
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${company.riskScore}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-900">{company.riskScore}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatCurrency(company.recommendedLimit)} {company.recommendedLimit ? 'Cr.' : ''}
                                    </div>
                                    {company.limitValidity && (
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Valid till {formatDate(company.limitValidity)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor('Active')}`}>
                                        Active
                                    </span>
                                    <div className="flex gap-1 mt-1">
                                        {company.gstCompliance && (
                                            <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${company.gstCompliance === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                GST
                                            </span>
                                        )}
                                        {company.epfoCompliance && (
                                            <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${company.epfoCompliance === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                EPFO
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(company.lastUpdated)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <Link
                                            href={`/companies/${generateCompanySlug(company.name, company.pan, company.cin)}`}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="View Company Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        {/* <button
                                            className="text-green-600 hover:text-green-900"
                                            title="Edit Company"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete Company"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button> */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}