"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import {
	Search,
	Building2,
	FileText,
	CheckCircle,
	ArrowRight,
	ArrowLeft,
	AlertTriangle,
	Sparkles,
	Database,
	Upload,
	Edit3
} from "lucide-react";

// Import workflow components
import { CompanySearchStep } from "./components/CompanySearchStep";
import { EntityTypeSelection } from "./components/EntityTypeSelection";
import { ProcessingMethodSelector } from "./components/ProcessingMethodSelector";
import { WorkflowProgress } from "./components/WorkflowProgress";

// Import form components
import { ApiProcessingForm } from "./components/ApiProcessingForm";
import { ExcelUploadForm } from "./components/ExcelUploadForm";
import { ManualEntryForms } from "./components/ManualEntryForms";

// Types
import {
	CompanySearchResult,
	EntityType,
	ProcessingMethod,
	WorkflowStep,
	ManualCompanyEntry,
	ValidationError
} from "@/types/manual-company.types";

interface AddCompanyState {
	currentStep: number
	searchResults: CompanySearchResult[]
	selectedCompany: CompanySearchResult | null
	entityType: EntityType | null
	processingMethod: ProcessingMethod | null
	formData: {
		basicDetails: any
		ownership: any
		financial: any
		compliance: any
	}
	validation: {
		errors: ValidationError[]
		warnings: ValidationError[]
		isValid: boolean
	}
	processing: {
		isProcessing: boolean
		progress: number
		status: string
		requestId?: string
	}
}

const WORKFLOW_STEPS: WorkflowStep[] = [
	{
		step_number: 1,
		step_name: "Company Search",
		step_type: "search",
		is_completed: false,
		is_current: true,
		is_optional: false,
		validation_errors: []
	},
	{
		step_number: 2,
		step_name: "Entity Type",
		step_type: "selection",
		is_completed: false,
		is_current: false,
		is_optional: false,
		validation_errors: []
	},
	{
		step_number: 3,
		step_name: "Processing Method",
		step_type: "selection",
		is_completed: false,
		is_current: false,
		is_optional: false,
		validation_errors: []
	},
	{
		step_number: 4,
		step_name: "Data Entry",
		step_type: "form",
		is_completed: false,
		is_current: false,
		is_optional: false,
		validation_errors: []
	},
	{
		step_number: 5,
		step_name: "Review & Submit",
		step_type: "review",
		is_completed: false,
		is_current: false,
		is_optional: false,
		validation_errors: []
	}
];

export default function EnhancedAddCompanyPage() {
	const router = useRouter();

	const [state, setState] = useState<AddCompanyState>({
		currentStep: 1,
		searchResults: [],
		selectedCompany: null,
		entityType: null,
		processingMethod: null,
		formData: {
			basicDetails: {},
			ownership: {},
			financial: {},
			compliance: {}
		},
		validation: {
			errors: [],
			warnings: [],
			isValid: false
		},
		processing: {
			isProcessing: false,
			progress: 0,
			status: 'idle'
		}
	});

	const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(WORKFLOW_STEPS);

	// Update workflow steps based on current state
	useEffect(() => {
		setWorkflowSteps(prev => prev.map(step => ({
			...step,
			is_completed: step.step_number < state.currentStep,
			is_current: step.step_number === state.currentStep
		})));
	}, [state.currentStep]);

	// Navigation handlers
	const goToNextStep = () => {
		if (state.currentStep < WORKFLOW_STEPS.length) {
			setState(prev => ({
				...prev,
				currentStep: prev.currentStep + 1
			}));
		}
	};

	const goToPreviousStep = () => {
		if (state.currentStep > 1) {
			setState(prev => ({
				...prev,
				currentStep: prev.currentStep - 1
			}));
		}
	};

	const goToStep = (stepNumber: number) => {
		if (stepNumber >= 1 && stepNumber <= WORKFLOW_STEPS.length) {
			setState(prev => ({
				...prev,
				currentStep: stepNumber
			}));
		}
	};

	// Data handlers
	const handleSearchResults = (results: CompanySearchResult[]) => {
		setState(prev => ({
			...prev,
			searchResults: results
		}));
	};

	const handleCompanySelect = (company: CompanySearchResult) => {
		setState(prev => ({
			...prev,
			selectedCompany: company,
			entityType: company.entity_type
		}));

		// If company is found, skip entity type selection
		if (company.entity_type) {
			setState(prev => ({
				...prev,
				currentStep: 3
			}));
		} else {
			goToNextStep();
		}
	};

	const handleEntityTypeSelect = (entityType: EntityType) => {
		setState(prev => ({
			...prev,
			entityType
		}));
		goToNextStep();
	};

	const handleProcessingMethodSelect = (method: ProcessingMethod) => {
		setState(prev => ({
			...prev,
			processingMethod: method
		}));
		goToNextStep();
	};

	const handleFormDataUpdate = (section: string, data: any) => {
		setState(prev => ({
			...prev,
			formData: {
				...prev.formData,
				[section]: data
			}
		}));
	};

	const handleValidationUpdate = (errors: ValidationError[], warnings: ValidationError[] = []) => {
		setState(prev => ({
			...prev,
			validation: {
				errors,
				warnings,
				isValid: errors.length === 0
			}
		}));
	};

	const handleProcessingStart = () => {
		setState(prev => ({
			...prev,
			processing: {
				...prev.processing,
				isProcessing: true,
				progress: 0,
				status: 'Starting processing...'
			}
		}));
	};

	const handleProcessingComplete = (requestId: string) => {
		setState(prev => ({
			...prev,
			processing: {
				...prev.processing,
				isProcessing: false,
				progress: 100,
				status: 'Completed',
				requestId
			}
		}));

		// Navigate to the company detail page
		setTimeout(() => {
			router.push(`/portfolio/${requestId}`);
		}, 2000);
	};

	const handleProcessingError = (error: string) => {
		setState(prev => ({
			...prev,
			processing: {
				...prev.processing,
				isProcessing: false,
				progress: 0,
				status: `Error: ${error}`
			}
		}));
	};

	// Determine if current step can proceed
	const canProceedToNext = () => {
		switch (state.currentStep) {
			case 1: // Search step
				return state.selectedCompany !== null || state.searchResults.length === 0;
			case 2: // Entity type step
				return state.entityType !== null;
			case 3: // Processing method step
				return state.processingMethod !== null;
			case 4: // Data entry step
				return state.validation.isValid;
			case 5: // Review step
				return true;
			default:
				return false;
		}
	};

	// Render current step content
	const renderStepContent = () => {
		switch (state.currentStep) {
			case 1:
				return (
					<CompanySearchStep
						searchResults={state.searchResults}
						selectedCompany={state.selectedCompany}
						onSearchResults={handleSearchResults}
						onCompanySelect={handleCompanySelect}
						onNoResultsAction={() => goToNextStep()}
					/>
				);

			case 2:
				return (
					<EntityTypeSelection
						selectedEntityType={state.entityType}
						onEntityTypeSelect={handleEntityTypeSelect}
						preSelectedCompany={state.selectedCompany}
					/>
				);

			case 3:
				return (
					<ProcessingMethodSelector
						entityType={state.entityType!}
						selectedCompany={state.selectedCompany}
						selectedMethod={state.processingMethod}
						onMethodSelect={handleProcessingMethodSelect}
					/>
				);

			case 4:
				if (!state.processingMethod) return null;

				switch (state.processingMethod.type) {
					case 'api':
						return (
							<ApiProcessingForm
								selectedCompany={state.selectedCompany!}
								onProcessingStart={handleProcessingStart}
								onProcessingComplete={handleProcessingComplete}
								onProcessingError={handleProcessingError}
							/>
						);

					case 'excel':
						return (
							<ExcelUploadForm
								selectedCompany={state.selectedCompany}
								entityType={state.entityType!}
								onUploadComplete={handleProcessingComplete}
								onUploadError={handleProcessingError}
								onFormDataUpdate={handleFormDataUpdate}
							/>
						);

					case 'manual':
						return (
							<ManualEntryForms
								entityType={state.entityType!}
								selectedCompany={state.selectedCompany}
								formData={state.formData}
								onFormDataUpdate={handleFormDataUpdate}
								onValidationUpdate={handleValidationUpdate}
								onSubmissionComplete={handleProcessingComplete}
								onSubmissionError={handleProcessingError}
							/>
						);

					default:
						return (
							<Alert variant="error">
								<AlertTriangle className="w-4 h-4" />
								<div>
									<p className="font-medium">Invalid Processing Method</p>
									<p className="text-sm mt-1">Please go back and select a valid processing method.</p>
								</div>
							</Alert>
						);
				}

			case 5:
				return (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<h3 className="text-lg font-semibold flex items-center gap-2">
									<CheckCircle className="w-5 h-5 text-green-600" />
									Review & Submit
								</h3>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-neutral-70">Company Name</label>
										<p className="text-neutral-90">
											{state.selectedCompany?.name || state.formData.basicDetails?.legal_name || 'Unknown'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-neutral-70">Entity Type</label>
										<p className="text-neutral-90">
											{state.entityType?.replace('_', ' ').toUpperCase() || 'Unknown'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-neutral-70">Processing Method</label>
										<p className="text-neutral-90">
											{state.processingMethod?.type.toUpperCase() || 'Unknown'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-neutral-70">Data Completeness</label>
										<p className="text-neutral-90">
											{state.processingMethod?.data_completeness_expected || 0}%
										</p>
									</div>
								</div>

								{state.validation.warnings.length > 0 && (
									<Alert variant="warning">
										<AlertTriangle className="w-4 h-4" />
										<div>
											<p className="font-medium">Warnings</p>
											<ul className="text-sm mt-1 list-disc list-inside">
												{state.validation.warnings.map((warning, index) => (
													<li key={index}>{warning.message}</li>
												))}
											</ul>
										</div>
									</Alert>
								)}

								<div className="flex justify-center">
									<Button
										onClick={() => {
											handleProcessingStart();
											// Simulate processing completion for demo
											setTimeout(() => {
												handleProcessingComplete(`REQ_${Date.now()}`);
											}, 3000);
										}}
										disabled={state.processing.isProcessing}
										className="px-8"
									>
										{state.processing.isProcessing ? 'Processing...' : 'Submit & Process'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-neutral-10">
			{/* Header */}
			<div className="bg-white border-b border-neutral-20 px-6 py-4">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push('/companies')}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Companies
						</Button>
						<div className="h-6 w-px bg-neutral-30" />
						<div>
							<h1 className="text-2xl font-bold text-neutral-90">Add Company</h1>
							<p className="text-sm text-neutral-60">
								Add a new company to your portfolio through intelligent workflow
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Badge variant="info" className="flex items-center gap-1">
							<Sparkles className="w-3 h-3" />
							Enhanced Workflow
						</Badge>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-6xl mx-auto p-6">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Progress Sidebar */}
					<div className="lg:col-span-1">
						<WorkflowProgress
							steps={workflowSteps}
							currentStep={state.currentStep}
							onStepClick={goToStep}
						/>

						{/* Processing Status */}
						{state.processing.isProcessing && (
							<Card className="mt-6">
								<CardHeader>
									<h3 className="text-sm font-semibold">Processing Status</h3>
								</CardHeader>
								<CardContent className="space-y-3">
									<Progress value={state.processing.progress} className="w-full" />
									<p className="text-xs text-neutral-60">{state.processing.status}</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Main Content Area */}
					<div className="lg:col-span-3">
						<Card className="min-h-[600px]">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-xl font-semibold text-neutral-90">
											{WORKFLOW_STEPS[state.currentStep - 1]?.step_name}
										</h2>
										<p className="text-sm text-neutral-60 mt-1">
											Step {state.currentStep} of {WORKFLOW_STEPS.length}
										</p>
									</div>

									{state.validation.errors.length > 0 && (
										<Badge variant="error" className="flex items-center gap-1">
											<AlertTriangle className="w-3 h-3" />
											{state.validation.errors.length} Error{state.validation.errors.length !== 1 ? 's' : ''}
										</Badge>
									)}
								</div>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* Validation Errors */}
								{state.validation.errors.length > 0 && (
									<Alert variant="error">
										<AlertTriangle className="w-4 h-4" />
										<div>
											<p className="font-medium">Please fix the following errors:</p>
											<ul className="text-sm mt-1 list-disc list-inside">
												{state.validation.errors.map((error, index) => (
													<li key={index}>{error.message}</li>
												))}
											</ul>
										</div>
									</Alert>
								)}

								{/* Step Content */}
								{renderStepContent()}

								{/* Navigation */}
								<div className="flex items-center justify-between pt-6 border-t border-neutral-20">
									<Button
										variant="outline"
										onClick={goToPreviousStep}
										disabled={state.currentStep === 1 || state.processing.isProcessing}
										className="flex items-center gap-2"
									>
										<ArrowLeft className="w-4 h-4" />
										Previous
									</Button>

									<div className="flex items-center gap-2">
										<span className="text-sm text-neutral-60">
											Step {state.currentStep} of {WORKFLOW_STEPS.length}
										</span>
									</div>

									<Button
										onClick={goToNextStep}
										disabled={!canProceedToNext() || state.currentStep === WORKFLOW_STEPS.length || state.processing.isProcessing}
										className="flex items-center gap-2"
									>
										Next
										<ArrowRight className="w-4 h-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}