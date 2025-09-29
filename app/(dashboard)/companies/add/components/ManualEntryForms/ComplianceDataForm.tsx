'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EntityType, ComplianceData, GSTRegistration, EPFOEstablishment, LegalCase, StatutoryAuditDetails } from '@/types/manual-company.types'
import {
    Info,
    Shield,
    FileText,
    Users,
    Scale,
    BookOpen,
    Plus,
    Trash2,
    Building2,
    Calendar,
    AlertTriangle,
    CheckCircle
} from 'lucide-react'

interface ComplianceDataFormProps {
    entityType: EntityType
    data: ComplianceData
    onChange: (data: ComplianceData) => void
}

export function ComplianceDataForm({
    entityType,
    data = {},
    onChange
}: ComplianceDataFormProps) {
    const [activeTab, setActiveTab] = useState<'gst' | 'epfo' | 'legal' | 'audit'>('gst')

    const updateGSTData = (gstData: any) => {
        onChange({
            ...data,
            gst_data: gstData
        })
    }

    const updateEPFOData = (epfoData: any) => {
        onChange({
            ...data,
            epfo_data: epfoData
        })
    }

    const updateLegalData = (legalData: any) => {
        onChange({
            ...data,
            legal_data: legalData
        })
    }

    const updateAuditData = (auditData: any) => {
        onChange({
            ...data,
            audit_data: auditData
        })
    }

    const tabs = [
        { id: 'gst', label: 'GST Compliance', icon: FileText, color: 'blue' },
        { id: 'epfo', label: 'EPFO Details', icon: Users, color: 'green' },
        { id: 'legal', label: 'Legal Cases', icon: Scale, color: 'orange' },
        { id: 'audit', label: 'Audit Reports', icon: BookOpen, color: 'purple' }
    ]

    return (
        <div className="space-y-6">
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">Compliance Information</p>
                    <p className="text-sm mt-1">
                        Add GST, EPFO, legal, and regulatory compliance information. All fields are optional and can be updated later.
                    </p>
                </div>
            </Alert>

            {/* Tab Navigation */}
            <div className="border-b border-neutral-200">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? `border-${tab.color}-500 text-${tab.color}-600`
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'gst' && (
                    <GSTComplianceForm
                        data={data.gst_data}
                        onChange={updateGSTData}
                        entityType={entityType}
                    />
                )}
                {activeTab === 'epfo' && (
                    <EPFOComplianceForm
                        data={data.epfo_data}
                        onChange={updateEPFOData}
                        entityType={entityType}
                    />
                )}
                {activeTab === 'legal' && (
                    <LegalComplianceForm
                        data={data.legal_data}
                        onChange={updateLegalData}
                        entityType={entityType}
                    />
                )}
                {activeTab === 'audit' && (
                    <AuditComplianceForm
                        data={data.audit_data}
                        onChange={updateAuditData}
                        entityType={entityType}
                    />
                )}
            </div>
        </div>
    )
}

// GST Compliance Form Component
function GSTComplianceForm({
    data = { registrations: [] },
    onChange,
    entityType
}: {
    data: any
    onChange: (data: any) => void
    entityType: EntityType
}) {
    const addGSTRegistration = () => {
        const newRegistration: Partial<GSTRegistration> = {
            gstin: '',
            registration_date: '',
            registration_status: 'active',
            business_nature: '',
            state_code: '',
            legal_name: '',
            trade_name: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }

        onChange({
            ...data,
            registrations: [...(data.registrations || []), newRegistration]
        })
    }

    const updateRegistration = (index: number, field: string, value: any) => {
        const updatedRegistrations = [...(data.registrations || [])]
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            updatedRegistrations[index] = {
                ...updatedRegistrations[index],
                [parent]: {
                    ...updatedRegistrations[index][parent],
                    [child]: value
                }
            }
        } else {
            updatedRegistrations[index] = {
                ...updatedRegistrations[index],
                [field]: value
            }
        }
        onChange({
            ...data,
            registrations: updatedRegistrations
        })
    }

    const removeRegistration = (index: number) => {
        const updatedRegistrations = data.registrations.filter((_: any, i: number) => i !== index)
        onChange({
            ...data,
            registrations: updatedRegistrations
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">GST Registration Details</h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addGSTRegistration}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Add GST Registration
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.registrations?.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-4">No GST registrations added</p>
                            <Button
                                variant="primary"
                                onClick={addGSTRegistration}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Add First GST Registration
                            </Button>
                        </div>
                    ) : (
                        data.registrations?.map((registration: any, index: number) => (
                            <Card key={index} className="border border-neutral-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">GST Registration #{index + 1}</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRegistration(index)}
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="GSTIN"
                                            placeholder="22AAAAA0000A1Z5"
                                            value={registration.gstin || ''}
                                            onChange={(e) => updateRegistration(index, 'gstin', e.target.value)}
                                            required
                                        />
                                        <Input
                                            label="Registration Date"
                                            type="date"
                                            value={registration.registration_date || ''}
                                            onChange={(e) => updateRegistration(index, 'registration_date', e.target.value)}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Registration Status
                                            </label>
                                            <select
                                                value={registration.registration_status || 'active'}
                                                onChange={(e) => updateRegistration(index, 'registration_status', e.target.value)}
                                                className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="Business Nature"
                                            placeholder="Manufacturing, Trading, Service"
                                            value={registration.business_nature || ''}
                                            onChange={(e) => updateRegistration(index, 'business_nature', e.target.value)}
                                        />
                                        <Input
                                            label="Legal Name"
                                            placeholder="Legal name as per GST registration"
                                            value={registration.legal_name || ''}
                                            onChange={(e) => updateRegistration(index, 'legal_name', e.target.value)}
                                        />
                                        <Input
                                            label="Trade Name"
                                            placeholder="Trade name (if different)"
                                            value={registration.trade_name || ''}
                                            onChange={(e) => updateRegistration(index, 'trade_name', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="font-medium text-neutral-90">Registered Address</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Address Line 1"
                                                placeholder="Building, Street"
                                                value={registration.address?.address_line_1 || ''}
                                                onChange={(e) => updateRegistration(index, 'address.address_line_1', e.target.value)}
                                            />
                                            <Input
                                                label="City"
                                                placeholder="City"
                                                value={registration.address?.city || ''}
                                                onChange={(e) => updateRegistration(index, 'address.city', e.target.value)}
                                            />
                                            <Input
                                                label="State"
                                                placeholder="State"
                                                value={registration.address?.state || ''}
                                                onChange={(e) => updateRegistration(index, 'address.state', e.target.value)}
                                            />
                                            <Input
                                                label="Pincode"
                                                placeholder="123456"
                                                value={registration.address?.pincode || ''}
                                                onChange={(e) => updateRegistration(index, 'address.pincode', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// EPFO Compliance Form Component
function EPFOComplianceForm({
    data = { establishments: [] },
    onChange,
    entityType
}: {
    data: any
    onChange: (data: any) => void
    entityType: EntityType
}) {
    const addEstablishment = () => {
        const newEstablishment: Partial<EPFOEstablishment> = {
            establishment_code: '',
            establishment_name: '',
            registration_date: '',
            registration_status: 'active',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            },
            employee_count: 0,
            active_members: 0,
            monthly_contribution: 0
        }

        onChange({
            ...data,
            establishments: [...(data.establishments || []), newEstablishment]
        })
    }

    const updateEstablishment = (index: number, field: string, value: any) => {
        const updatedEstablishments = [...(data.establishments || [])]
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            updatedEstablishments[index] = {
                ...updatedEstablishments[index],
                [parent]: {
                    ...updatedEstablishments[index][parent],
                    [child]: value
                }
            }
        } else {
            updatedEstablishments[index] = {
                ...updatedEstablishments[index],
                [field]: value
            }
        }
        onChange({
            ...data,
            establishments: updatedEstablishments
        })
    }

    const removeEstablishment = (index: number) => {
        const updatedEstablishments = data.establishments.filter((_: any, i: number) => i !== index)
        onChange({
            ...data,
            establishments: updatedEstablishments
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold">EPFO Establishment Details</h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addEstablishment}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Add Establishment
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.establishments?.length === 0 ? (
                        <div className="text-center py-8">
                            <Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-4">No EPFO establishments added</p>
                            <Button
                                variant="primary"
                                onClick={addEstablishment}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Add First Establishment
                            </Button>
                        </div>
                    ) : (
                        data.establishments?.map((establishment: any, index: number) => (
                            <Card key={index} className="border border-neutral-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Establishment #{index + 1}</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeEstablishment(index)}
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Establishment Code"
                                            placeholder="DLCPM1234567890"
                                            value={establishment.establishment_code || ''}
                                            onChange={(e) => updateEstablishment(index, 'establishment_code', e.target.value)}
                                        />
                                        <Input
                                            label="Establishment Name"
                                            placeholder="Company Name - Location"
                                            value={establishment.establishment_name || ''}
                                            onChange={(e) => updateEstablishment(index, 'establishment_name', e.target.value)}
                                        />
                                        <Input
                                            label="Registration Date"
                                            type="date"
                                            value={establishment.registration_date || ''}
                                            onChange={(e) => updateEstablishment(index, 'registration_date', e.target.value)}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Registration Status
                                            </label>
                                            <select
                                                value={establishment.registration_status || 'active'}
                                                onChange={(e) => updateEstablishment(index, 'registration_status', e.target.value)}
                                                className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="Employee Count"
                                            type="number"
                                            placeholder="0"
                                            value={establishment.employee_count || ''}
                                            onChange={(e) => updateEstablishment(index, 'employee_count', parseInt(e.target.value) || 0)}
                                        />
                                        <Input
                                            label="Active Members"
                                            type="number"
                                            placeholder="0"
                                            value={establishment.active_members || ''}
                                            onChange={(e) => updateEstablishment(index, 'active_members', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="font-medium text-neutral-90">Establishment Address</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Address Line 1"
                                                placeholder="Building, Street"
                                                value={establishment.address?.address_line_1 || ''}
                                                onChange={(e) => updateEstablishment(index, 'address.address_line_1', e.target.value)}
                                            />
                                            <Input
                                                label="City"
                                                placeholder="City"
                                                value={establishment.address?.city || ''}
                                                onChange={(e) => updateEstablishment(index, 'address.city', e.target.value)}
                                            />
                                            <Input
                                                label="State"
                                                placeholder="State"
                                                value={establishment.address?.state || ''}
                                                onChange={(e) => updateEstablishment(index, 'address.state', e.target.value)}
                                            />
                                            <Input
                                                label="Pincode"
                                                placeholder="123456"
                                                value={establishment.address?.pincode || ''}
                                                onChange={(e) => updateEstablishment(index, 'address.pincode', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Legal Compliance Form Component
function LegalComplianceForm({
    data = { legal_cases: [] },
    onChange,
    entityType
}: {
    data: any
    onChange: (data: any) => void
    entityType: EntityType
}) {
    const addLegalCase = () => {
        const newCase: Partial<LegalCase> = {
            case_number: '',
            case_type: 'civil',
            court_name: '',
            filing_date: '',
            case_status: 'pending',
            case_description: '',
            amount_involved: 0,
            outcome: '',
            impact_assessment: 'low'
        }

        onChange({
            ...data,
            legal_cases: [...(data.legal_cases || []), newCase]
        })
    }

    const updateCase = (index: number, field: string, value: any) => {
        const updatedCases = [...(data.legal_cases || [])]
        updatedCases[index] = {
            ...updatedCases[index],
            [field]: value
        }
        onChange({
            ...data,
            legal_cases: updatedCases
        })
    }

    const removeCase = (index: number) => {
        const updatedCases = data.legal_cases.filter((_: any, i: number) => i !== index)
        onChange({
            ...data,
            legal_cases: updatedCases
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-semibold">Legal Cases & Disputes</h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addLegalCase}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Add Legal Case
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.legal_cases?.length === 0 ? (
                        <div className="text-center py-8">
                            <Scale className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-2">No legal cases recorded</p>
                            <p className="text-sm text-neutral-500 mb-4">Add any ongoing or past legal cases, disputes, or regulatory actions</p>
                            <Button
                                variant="primary"
                                onClick={addLegalCase}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Add Legal Case
                            </Button>
                        </div>
                    ) : (
                        data.legal_cases?.map((legalCase: any, index: number) => (
                            <Card key={index} className="border border-neutral-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Legal Case #{index + 1}</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCase(index)}
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Case Number"
                                            placeholder="CS/123/2024"
                                            value={legalCase.case_number || ''}
                                            onChange={(e) => updateCase(index, 'case_number', e.target.value)}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Case Type
                                            </label>
                                            <select
                                                value={legalCase.case_type || 'civil'}
                                                onChange={(e) => updateCase(index, 'case_type', e.target.value)}
                                                className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="civil">Civil</option>
                                                <option value="criminal">Criminal</option>
                                                <option value="tax">Tax</option>
                                                <option value="labor">Labor</option>
                                                <option value="regulatory">Regulatory</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="Court Name"
                                            placeholder="District Court, High Court, etc."
                                            value={legalCase.court_name || ''}
                                            onChange={(e) => updateCase(index, 'court_name', e.target.value)}
                                        />
                                        <Input
                                            label="Filing Date"
                                            type="date"
                                            value={legalCase.filing_date || ''}
                                            onChange={(e) => updateCase(index, 'filing_date', e.target.value)}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Case Status
                                            </label>
                                            <select
                                                value={legalCase.case_status || 'pending'}
                                                onChange={(e) => updateCase(index, 'case_status', e.target.value)}
                                                className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="disposed">Disposed</option>
                                                <option value="settled">Settled</option>
                                                <option value="withdrawn">Withdrawn</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="Amount Involved (₹)"
                                            type="number"
                                            placeholder="0"
                                            value={legalCase.amount_involved || ''}
                                            onChange={(e) => updateCase(index, 'amount_involved', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Case Description
                                            </label>
                                            <Textarea
                                                placeholder="Brief description of the case, parties involved, and key issues"
                                                value={legalCase.case_description || ''}
                                                onChange={(e) => updateCase(index, 'case_description', e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                Impact Assessment
                                            </label>
                                            <select
                                                value={legalCase.impact_assessment || 'low'}
                                                onChange={(e) => updateCase(index, 'impact_assessment', e.target.value)}
                                                className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="low">Low Impact</option>
                                                <option value="medium">Medium Impact</option>
                                                <option value="high">High Impact</option>
                                            </select>
                                        </div>

                                        {legalCase.case_status !== 'pending' && (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-90 mb-1">
                                                    Outcome
                                                </label>
                                                <Textarea
                                                    placeholder="Outcome or resolution of the case"
                                                    value={legalCase.outcome || ''}
                                                    onChange={(e) => updateCase(index, 'outcome', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Audit Compliance Form Component
function AuditComplianceForm({
    data = { statutory_audit: {} },
    onChange,
    entityType
}: {
    data: any
    onChange: (data: any) => void
    entityType: EntityType
}) {
    const updateStatutoryAudit = (field: string, value: any) => {
        onChange({
            ...data,
            statutory_audit: {
                ...data.statutory_audit,
                [field]: value
            }
        })
    }

    const isAuditRequired = ['private_limited', 'public_limited', 'llp'].includes(entityType)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">Audit & Compliance Reports</h3>
                        {isAuditRequired && (
                            <Badge variant="warning" size="sm">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Statutory Audit Required
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isAuditRequired ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-neutral-90 mb-4">Statutory Audit Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Auditor Name"
                                        placeholder="CA Name"
                                        value={data.statutory_audit?.auditor_name || ''}
                                        onChange={(e) => updateStatutoryAudit('auditor_name', e.target.value)}
                                    />
                                    <Input
                                        label="Auditor Firm"
                                        placeholder="Audit Firm Name"
                                        value={data.statutory_audit?.auditor_firm || ''}
                                        onChange={(e) => updateStatutoryAudit('auditor_firm', e.target.value)}
                                    />
                                    <Input
                                        label="Audit Period"
                                        placeholder="FY 2023-24"
                                        value={data.statutory_audit?.audit_period || ''}
                                        onChange={(e) => updateStatutoryAudit('audit_period', e.target.value)}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-90 mb-1">
                                            Audit Opinion
                                        </label>
                                        <select
                                            value={data.statutory_audit?.audit_opinion || 'unqualified'}
                                            onChange={(e) => updateStatutoryAudit('audit_opinion', e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="unqualified">Unqualified (Clean)</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="adverse">Adverse</option>
                                            <option value="disclaimer">Disclaimer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-90 mb-1">
                                            Key Audit Matters
                                        </label>
                                        <Textarea
                                            placeholder="Key audit matters highlighted by the auditor (one per line)"
                                            value={data.statutory_audit?.key_audit_matters?.join('\n') || ''}
                                            onChange={(e) => updateStatutoryAudit('key_audit_matters', e.target.value.split('\n').filter(Boolean))}
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-90 mb-1">
                                            Management Letter Points
                                        </label>
                                        <Textarea
                                            placeholder="Management letter observations (one per line)"
                                            value={data.statutory_audit?.management_letter_points?.join('\n') || ''}
                                            onChange={(e) => updateStatutoryAudit('management_letter_points', e.target.value.split('\n').filter(Boolean))}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="compliance_certificate"
                                            checked={data.statutory_audit?.compliance_certificate || false}
                                            onChange={(e) => updateStatutoryAudit('compliance_certificate', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="compliance_certificate" className="text-sm text-neutral-90">
                                            Compliance certificate issued
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-2">Statutory audit not required</p>
                            <p className="text-sm text-neutral-500">
                                {entityType.replace('_', ' ').toUpperCase()} entities may not require statutory audit based on turnover and other criteria
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}