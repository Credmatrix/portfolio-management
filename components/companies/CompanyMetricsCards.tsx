'use client';

import { Building2, TrendingUp, Shield, IndianRupee, Users } from 'lucide-react';
import { CompanyMetrics } from '@/types/company.types';

interface CompanyMetricsCardsProps {
    metrics: CompanyMetrics | null;
    loading: boolean;
}

export function CompanyMetricsCards({ metrics, loading }: CompanyMetricsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else {
            return `₹${amount.toFixed(0)}`;
        }
    };

    const cards = [
        {
            title: 'Total Companies',
            value: metrics.totalCompanies.toLocaleString(),
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Active Companies',
            value: metrics.activeCompanies.toLocaleString(),
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Total Credit Limit',
            value: formatCurrency(metrics.totalCreditLimit * 10000000),
            icon: IndianRupee,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Avg Risk Score',
            value: `${metrics.averageRiskScore} %`,
            icon: Shield,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        },
        {
            title: 'Low Risk Companies',
            value: `${metrics.riskDistribution.low}`,
            subtitle: `${((metrics.riskDistribution.low / metrics.totalCompanies) * 100).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                                {card.subtitle && (
                                    <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                                )}
                            </div>
                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <Icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}