"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function DashboardDemo() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-90 mb-2">
                    Dashboard Layout Implementation
                </h1>
                <p className="text-neutral-60">
                    Task 8.1 - Main dashboard layout with Fluent Design navigation
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="font-semibold text-neutral-90 mb-3 flex items-center gap-2">
                        <Badge variant="success">✓</Badge>
                        Responsive Sidebar
                    </h3>
                    <ul className="text-sm text-neutral-60 space-y-2">
                        <li>• Collapsible navigation</li>
                        <li>• Portfolio-specific sections</li>
                        <li>• Mobile-friendly overlay</li>
                        <li>• Fluent Design styling</li>
                    </ul>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-neutral-90 mb-3 flex items-center gap-2">
                        <Badge variant="success">✓</Badge>
                        Enhanced Header
                    </h3>
                    <ul className="text-sm text-neutral-60 space-y-2">
                        <li>• Global search functionality</li>
                        <li>• Notifications system</li>
                        <li>• User profile menu</li>
                        <li>• Responsive breadcrumbs</li>
                    </ul>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-neutral-90 mb-3 flex items-center gap-2">
                        <Badge variant="success">✓</Badge>
                        Breadcrumb Navigation
                    </h3>
                    <ul className="text-sm text-neutral-60 space-y-2">
                        <li>• Automatic path generation</li>
                        <li>• Context awareness</li>
                        <li>• Manual override support</li>
                        <li>• Mobile responsive</li>
                    </ul>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="font-semibold text-neutral-90 mb-3">
                    Microsoft Fluent Design Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-60">
                    <div>
                        <h4 className="font-medium text-neutral-80 mb-2">Design Principles</h4>
                        <ul className="space-y-1">
                            <li>• Depth with layered shadows</li>
                            <li>• Smooth motion and transitions</li>
                            <li>• Consistent color palette</li>
                            <li>• Responsive scaling</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-neutral-80 mb-2">Interactive Elements</h4>
                        <ul className="space-y-1">
                            <li>• Hover states and feedback</li>
                            <li>• Focus indicators</li>
                            <li>• Loading states</li>
                            <li>• Accessibility support</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}