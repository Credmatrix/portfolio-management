'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import {
    EntityType,
    OwnershipStructure,
    Director,
    Partner,
    Owner,
    Trustee,
    Member,
    ShareholdingPattern,
    Address
} from '@/types/manual-company.types'
import {
    Info,
    Plus,
    Trash2,
    User,
    Users,
    Building,
    FileText,
    AlertTriangle,
    Calculator,
    Upload,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOwnershipStructure } from '@/lib/hooks/useOwnershipStructure'

interface OwnershipStructureFormProps {
    entityType: EntityType
    data: OwnershipStructure
    onChange: (data: OwnershipStructure) => void
    errors?: Record<string, string>
}

export function OwnershipStructureForm({
    entityType,
    data = { entity_type: entityType },
    onChange,
    errors = {}
}: OwnershipStructureFormProps) {
    const {
        data: ownershipData,
        errors: validationErrors,
        isValid,
        percentageValidations,
        completionStatus,

        // Director actions
        addDirector,
        updateDirector,
        removeDirector,

        // Partner actions
        addPartner,
        updatePartner,
        removePartner,

        // Owner actions
        addOwner,
        updateOwner,
        removeOwner,

        // Trustee actions
        addTrustee,
        updateTrustee,
        removeTrustee,

        // Member actions
        addMember,
        updateMember,
        removeMember,

        // Shareholder actions
        addShareholder,
        updateShareholder,
        removeShareholder
    } = useOwnershipStructure({
        entityType,
        initialData: data,
        onChange
    })

    const getOwnershipTitle = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return 'Directors & Shareholders'
            case 'llp':
                return 'Partners'
            case 'partnership_registered':
            case 'partnership_unregistered':
                return 'Partners'
            case 'proprietorship':
                return 'Proprietor Details'
            case 'huf':
                return 'Karta & Family Members'
            case 'trust_private':
            case 'trust_public':
                return 'Trustees'
            case 'society':
                return 'Members & Governing Body'
            default:
                return 'Ownership Structure'
        }
    }

    const getOwnershipDescription = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return 'Add director information, shareholding patterns, and key management personnel.'
            case 'llp':
                return 'Add partner details, profit sharing ratios, and designated partners.'
            case 'partnership_registered':
            case 'partnership_unregistered':
                return 'Add partner information, capital contributions, and profit sharing arrangements.'
            case 'proprietorship':
                return 'Add proprietor personal details and business ownership information.'
            case 'huf':
                return 'Add Karta details, family member information, and business structure.'
            case 'trust_private':
            case 'trust_public':
                return 'Add trustee information, beneficiary details, and trust management structure.'
            case 'society':
                return 'Add member details, governing body information, and organizational structure.'
            default:
                return 'Add ownership and management structure information.'
        }
    }

    // Address form component
    const AddressForm = ({
        address,
        onChange,
        prefix = ''
    }: {
        address: Address,
        onChange: (address: Address) => void,
        prefix?: string
    }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <Input
                    label="Address Line 1"
                    value={address.address_line_1 || ''}
                    onChange={(e) => onChange({ ...address, address_line_1: e.target.value })}
                    required
                    error={errors[`${prefix}address_line_1`]}
                />
            </div>
            <div className="md:col-span-2">
                <Input
                    label="Address Line 2"
                    value={address.address_line_2 || ''}
                    onChange={(e) => onChange({ ...address, address_line_2: e.target.value })}
                />
            </div>
            <Input
                label="City"
                value={address.city || ''}
                onChange={(e) => onChange({ ...address, city: e.target.value })}
                required
                error={errors[`${prefix}city`]}
            />
            <Input
                label="State"
                value={address.state || ''}
                onChange={(e) => onChange({ ...address, state: e.target.value })}
                required
                error={errors[`${prefix}state`]}
            />
            <Input
                label="Pincode"
                value={address.pincode || ''}
                onChange={(e) => onChange({ ...address, pincode: e.target.value })}
                required
                pattern="[0-9]{6}"
                error={errors[`${prefix}pincode`]}
            />
            <Input
                label="Country"
                value={address.country || 'India'}
                onChange={(e) => onChange({ ...address, country: e.target.value })}
                required
            />
        </div>
    )

    // Director form for companies
    const DirectorForm = () => {
        const directors = ownershipData.directors || []

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Directors
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addDirector}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Director
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {directors.map((director, index) => (
                        <div key={director.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Director {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDirector(index)}
                                    className="text-error hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={director.name}
                                    onChange={(e) => updateDirector(index, { name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Designation"
                                    value={director.designation}
                                    onChange={(e) => updateDirector(index, { designation: e.target.value })}
                                    required
                                />
                                <Input
                                    label="DIN"
                                    value={director.din || ''}
                                    onChange={(e) => updateDirector(index, { din: e.target.value })}
                                    pattern="[0-9]{8}"
                                    helperText="8-digit Director Identification Number"
                                />
                                <Input
                                    label="PAN"
                                    value={director.pan || ''}
                                    onChange={(e) => updateDirector(index, { pan: e.target.value.toUpperCase() })}
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    helperText="10-character PAN number"
                                />
                                <Input
                                    label="Date of Appointment"
                                    type="date"
                                    value={director.date_of_appointment}
                                    onChange={(e) => updateDirector(index, { date_of_appointment: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Date of Cessation"
                                    type="date"
                                    value={director.date_of_cessation || ''}
                                    onChange={(e) => updateDirector(index, { date_of_cessation: e.target.value })}
                                />
                            </div>

                            <div>
                                <h5 className="font-medium mb-3">Address</h5>
                                <AddressForm
                                    address={director.address}
                                    onChange={(address) => updateDirector(index, { address })}
                                    prefix={`directors.${index}.`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Textarea
                                    label="Qualification"
                                    value={director.qualification || ''}
                                    onChange={(e) => updateDirector(index, { qualification: e.target.value })}
                                    rows={2}
                                />
                                <Textarea
                                    label="Experience"
                                    value={director.experience || ''}
                                    onChange={(e) => updateDirector(index, { experience: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}

                    {directors.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <User className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No directors added yet</p>
                            <p className="text-sm">Click "Add Director" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Shareholding pattern for companies
    const ShareholdingForm = () => {
        const shareholding = ownershipData.shareholding || []

        const totalPercentage = shareholding.reduce((sum, sh) => sum + (sh.percentage || 0), 0)
        const percentageValidation = percentageValidations.find(pv => pv.field === 'shareholding_percentage')

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Shareholding Pattern
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addShareholder}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Shareholder
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {percentageValidation && !percentageValidation.isValid && (
                        <Alert variant="error">
                            <AlertTriangle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Shareholding Error</p>
                                <p className="text-sm">{percentageValidation.message}</p>
                            </div>
                        </Alert>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                        <Calculator className="w-4 h-4" />
                        <span>Total Shareholding: {totalPercentage.toFixed(2)}%</span>
                        <span className={cn(
                            "px-2 py-1 rounded text-xs flex items-center gap-1",
                            Math.abs(totalPercentage - 100) < 0.01
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                        )}>
                            {Math.abs(totalPercentage - 100) < 0.01 ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Complete
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Incomplete
                                </>
                            )}
                        </span>
                    </div>

                    {shareholding.map((shareholder, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Shareholder {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeShareholder(index)}
                                    className="text-error hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Input
                                    label="Shareholder Name"
                                    value={shareholder.shareholder_name}
                                    onChange={(e) => updateShareholder(index, { shareholder_name: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Shareholder Type"
                                    value={shareholder.shareholder_type}
                                    onChange={(e) => updateShareholder(index, { shareholder_type: e.target.value as any })}
                                    required
                                >
                                    <option value="individual">Individual</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="institutional">Institutional</option>
                                </Select>
                                <Input
                                    label="Shares Held"
                                    type="number"
                                    value={shareholder.shares_held}
                                    onChange={(e) => updateShareholder(index, { shares_held: parseInt(e.target.value) || 0 })}
                                    required
                                    min="0"
                                />
                                <Input
                                    label="Percentage"
                                    type="number"
                                    step="0.01"
                                    value={shareholder.percentage}
                                    onChange={(e) => updateShareholder(index, { percentage: parseFloat(e.target.value) || 0 })}
                                    required
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Share Class"
                                    value={shareholder.share_class}
                                    onChange={(e) => updateShareholder(index, { share_class: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Voting Rights"
                                    type="number"
                                    value={shareholder.voting_rights || ''}
                                    onChange={(e) => updateShareholder(index, { voting_rights: parseInt(e.target.value) || undefined })}
                                    helperText="Leave blank if same as shareholding percentage"
                                />
                            </div>
                        </div>
                    ))}

                    {shareholding.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <Building className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No shareholders added yet</p>
                            <p className="text-sm">Click "Add Shareholder" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Partner form for partnerships and LLPs
    const PartnerForm = () => {
        const partners = ownershipData.partners || []

        const totalProfitSharing = partners.reduce((sum, partner) => sum + (partner.profit_sharing_ratio || 0), 0)
        const percentageValidation = percentageValidations.find(pv => pv.field === 'profit_sharing_ratio')

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Partners
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPartner}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Partner
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {percentageValidation && !percentageValidation.isValid && (
                        <Alert variant="error">
                            <AlertTriangle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Profit Sharing Error</p>
                                <p className="text-sm">{percentageValidation.message}</p>
                            </div>
                        </Alert>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                        <Calculator className="w-4 h-4" />
                        <span>Total Profit Sharing: {totalProfitSharing.toFixed(2)}%</span>
                        <span className={cn(
                            "px-2 py-1 rounded text-xs flex items-center gap-1",
                            Math.abs(totalProfitSharing - 100) < 0.01
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                        )}>
                            {Math.abs(totalProfitSharing - 100) < 0.01 ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Complete
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Incomplete
                                </>
                            )}
                        </span>
                    </div>

                    {partners.map((partner, index) => (
                        <div key={partner.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Partner {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePartner(index)}
                                    className="text-error hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={partner.name}
                                    onChange={(e) => updatePartner(index, { name: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Partner Type"
                                    value={partner.partner_type}
                                    onChange={(e) => updatePartner(index, { partner_type: e.target.value as any })}
                                    required
                                >
                                    <option value="active">Active Partner</option>
                                    <option value="sleeping">Sleeping Partner</option>
                                    <option value="limited">Limited Partner</option>
                                    <option value="nominal">Nominal Partner</option>
                                </Select>
                                <Input
                                    label="PAN"
                                    value={partner.pan || ''}
                                    onChange={(e) => updatePartner(index, { pan: e.target.value.toUpperCase() })}
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    helperText="10-character PAN number"
                                />
                                <Input
                                    label="Date of Admission"
                                    type="date"
                                    value={partner.date_of_admission}
                                    onChange={(e) => updatePartner(index, { date_of_admission: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Capital Contribution (₹)"
                                    type="number"
                                    value={partner.capital_contribution}
                                    onChange={(e) => updatePartner(index, { capital_contribution: parseFloat(e.target.value) || 0 })}
                                    required
                                    min="0"
                                />
                                <Input
                                    label="Profit Sharing Ratio (%)"
                                    type="number"
                                    step="0.01"
                                    value={partner.profit_sharing_ratio}
                                    onChange={(e) => updatePartner(index, { profit_sharing_ratio: parseFloat(e.target.value) || 0 })}
                                    required
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div>
                                <h5 className="font-medium mb-3">Address</h5>
                                <AddressForm
                                    address={partner.address}
                                    onChange={(address) => updatePartner(index, { address })}
                                    prefix={`partners.${index}.`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Textarea
                                    label="Qualification"
                                    value={partner.qualification || ''}
                                    onChange={(e) => updatePartner(index, { qualification: e.target.value })}
                                    rows={2}
                                />
                                <Textarea
                                    label="Experience"
                                    value={partner.experience || ''}
                                    onChange={(e) => updatePartner(index, { experience: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}

                    {partners.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No partners added yet</p>
                            <p className="text-sm">Click "Add Partner" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Owner form for proprietorship and HUF
    const OwnerForm = () => {
        const owners = ownershipData.owners || []
        const isHUF = entityType === 'huf'

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {isHUF ? 'Karta & Family Members' : 'Proprietor Details'}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addOwner}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            {isHUF ? 'Add Member' : 'Add Owner'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {owners.map((owner, index) => (
                        <div key={owner.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                    {isHUF ? (index === 0 ? 'Karta' : `Family Member ${index}`) : `Owner ${index + 1}`}
                                </h4>
                                {!(isHUF && index === 0) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOwner(index)}
                                        className="text-error hover:text-error"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={owner.name}
                                    onChange={(e) => updateOwner(index, { name: e.target.value })}
                                    required
                                />
                                {isHUF && (
                                    <Input
                                        label="Relationship"
                                        value={owner.relationship || ''}
                                        onChange={(e) => updateOwner(index, { relationship: e.target.value })}
                                        placeholder={index === 0 ? "Karta" : "Son/Daughter/Spouse etc."}
                                    />
                                )}
                                <Input
                                    label="PAN"
                                    value={owner.pan || ''}
                                    onChange={(e) => updateOwner(index, { pan: e.target.value.toUpperCase() })}
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    helperText="10-character PAN number"
                                />
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={owner.date_of_birth || ''}
                                    onChange={(e) => updateOwner(index, { date_of_birth: e.target.value })}
                                />
                                {!isHUF && (
                                    <>
                                        <Input
                                            label="Ownership Percentage (%)"
                                            type="number"
                                            step="0.01"
                                            value={owner.ownership_percentage || ''}
                                            onChange={(e) => updateOwner(index, { ownership_percentage: parseFloat(e.target.value) || undefined })}
                                            min="0"
                                            max="100"
                                        />
                                        <Input
                                            label="Capital Contribution (₹)"
                                            type="number"
                                            value={owner.capital_contribution || ''}
                                            onChange={(e) => updateOwner(index, { capital_contribution: parseFloat(e.target.value) || undefined })}
                                            min="0"
                                        />
                                    </>
                                )}
                            </div>

                            <div>
                                <h5 className="font-medium mb-3">Address</h5>
                                <AddressForm
                                    address={owner.address}
                                    onChange={(address) => updateOwner(index, { address })}
                                    prefix={`owners.${index}.`}
                                />
                            </div>
                        </div>
                    ))}

                    {owners.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <User className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No {isHUF ? 'family members' : 'owners'} added yet</p>
                            <p className="text-sm">Click "Add {isHUF ? 'Member' : 'Owner'}" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Trustee form for trusts
    const TrusteeForm = () => {
        const trustees = ownershipData.trustees || []

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Trustees
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTrustee}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Trustee
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {trustees.map((trustee, index) => (
                        <div key={trustee.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Trustee {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTrustee(index)}
                                    className="text-error hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={trustee.name}
                                    onChange={(e) => updateTrustee(index, { name: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Trustee Type"
                                    value={trustee.trustee_type}
                                    onChange={(e) => updateTrustee(index, { trustee_type: e.target.value as any })}
                                    required
                                >
                                    <option value="managing">Managing Trustee</option>
                                    <option value="ordinary">Ordinary Trustee</option>
                                </Select>
                                <Input
                                    label="PAN"
                                    value={trustee.pan || ''}
                                    onChange={(e) => updateTrustee(index, { pan: e.target.value.toUpperCase() })}
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    helperText="10-character PAN number"
                                />
                                <Input
                                    label="Date of Appointment"
                                    type="date"
                                    value={trustee.date_of_appointment}
                                    onChange={(e) => updateTrustee(index, { date_of_appointment: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Date of Cessation"
                                    type="date"
                                    value={trustee.date_of_cessation || ''}
                                    onChange={(e) => updateTrustee(index, { date_of_cessation: e.target.value })}
                                />
                            </div>

                            <div>
                                <h5 className="font-medium mb-3">Address</h5>
                                <AddressForm
                                    address={trustee.address}
                                    onChange={(address) => updateTrustee(index, { address })}
                                    prefix={`trustees.${index}.`}
                                />
                            </div>

                            <div>
                                <Textarea
                                    label="Qualification"
                                    value={trustee.qualification || ''}
                                    onChange={(e) => updateTrustee(index, { qualification: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}

                    {trustees.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No trustees added yet</p>
                            <p className="text-sm">Click "Add Trustee" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Member form for societies
    const MemberForm = () => {
        const members = ownershipData.members || []

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Members & Governing Body
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMember}
                            className="ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {members.map((member, index) => (
                        <div key={member.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Member {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMember(index)}
                                    className="text-error hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={member.name}
                                    onChange={(e) => updateMember(index, { name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Membership Type"
                                    value={member.membership_type}
                                    onChange={(e) => updateMember(index, { membership_type: e.target.value })}
                                    required
                                    placeholder="e.g., President, Secretary, Member"
                                />
                                <Input
                                    label="Membership Number"
                                    value={member.membership_number || ''}
                                    onChange={(e) => updateMember(index, { membership_number: e.target.value })}
                                />
                                <Input
                                    label="Date of Admission"
                                    type="date"
                                    value={member.date_of_admission}
                                    onChange={(e) => updateMember(index, { date_of_admission: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Date of Cessation"
                                    type="date"
                                    value={member.date_of_cessation || ''}
                                    onChange={(e) => updateMember(index, { date_of_cessation: e.target.value })}
                                />
                            </div>

                            <div>
                                <h5 className="font-medium mb-3">Address</h5>
                                <AddressForm
                                    address={member.address}
                                    onChange={(address) => updateMember(index, { address })}
                                    prefix={`members.${index}.`}
                                />
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-8 text-neutral-60">
                            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-40" />
                            <p>No members added yet</p>
                            <p className="text-sm">Click "Add Member" to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // KYC Document Upload section
    const KYCDocumentSection = () => (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    KYC Documents & References
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Alert variant="info">
                        <Upload className="w-4 h-4" />
                        <div>
                            <p className="font-medium">Document Upload</p>
                            <p className="text-sm mt-1">
                                KYC document upload functionality will be available in the next phase.
                                You can upload documents after creating the company entry.
                            </p>
                        </div>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-60">
                        <div>
                            <h5 className="font-medium text-neutral-90 mb-2">Required Documents:</h5>
                            <ul className="space-y-1">
                                <li>• PAN Cards of all individuals</li>
                                <li>• Address proofs</li>
                                <li>• Photographs</li>
                                {['private_limited', 'public_limited'].includes(entityType) && (
                                    <>
                                        <li>• Board resolutions</li>
                                        <li>• Certificate of incorporation</li>
                                    </>
                                )}
                                {entityType === 'llp' && (
                                    <>
                                        <li>• LLP Agreement</li>
                                        <li>• Certificate of incorporation</li>
                                    </>
                                )}
                                {['partnership_registered', 'partnership_unregistered'].includes(entityType) && (
                                    <li>• Partnership deed</li>
                                )}
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-medium text-neutral-90 mb-2">Optional Documents:</h5>
                            <ul className="space-y-1">
                                <li>• Bank account statements</li>
                                <li>• GST certificates</li>
                                <li>• Professional qualifications</li>
                                <li>• Experience certificates</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const renderEntitySpecificForms = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return (
                    <div className="space-y-6">
                        <DirectorForm />
                        <ShareholdingForm />
                    </div>
                )

            case 'llp':
            case 'partnership_registered':
            case 'partnership_unregistered':
                return <PartnerForm />

            case 'proprietorship':
            case 'huf':
                return <OwnerForm />

            case 'trust_private':
            case 'trust_public':
                return <TrusteeForm />

            case 'society':
                return <MemberForm />

            default:
                return (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="w-8 h-8 text-neutral-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-90 mb-2">
                                        Unsupported Entity Type
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Please select a valid entity type to configure ownership structure.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
        }
    }

    return (
        <div className="space-y-6">
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">{getOwnershipTitle()}</p>
                    <p className="text-sm mt-1">{getOwnershipDescription()}</p>
                </div>
            </Alert>

            {/* Completion Status */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                completionStatus.isComplete ? "bg-success" : "bg-warning"
                            )} />
                            <span className="text-sm font-medium">
                                Completion Status: {completionStatus.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-xs text-neutral-60">
                            {completionStatus.completedFields} of {completionStatus.totalFields} sections completed
                        </div>
                    </div>

                    {Object.keys(validationErrors).length > 0 && (
                        <div className="mt-3 p-3 bg-error/10 rounded-lg">
                            <p className="text-sm font-medium text-error mb-1">Validation Issues:</p>
                            <ul className="text-xs text-error space-y-1">
                                {Object.values(validationErrors).map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {renderEntitySpecificForms()}

            <KYCDocumentSection />
        </div>
    )
}