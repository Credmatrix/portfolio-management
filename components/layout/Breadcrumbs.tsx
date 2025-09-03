"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    const pathname = usePathname();

    // Generate breadcrumbs from pathname if no items provided
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const segments = pathname.split("/").filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [
            { label: "Dashboard", href: "/portfolio" }
        ];

        let currentPath = "";
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === segments.length - 1;

            // Convert segment to readable label
            let label = segment
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            // Handle special cases
            if (segment === "portfolio") {
                label = "Portfolio";
            } else if (segment === "analytics") {
                label = "Analytics";
            } else if (segment === "upload") {
                label = "Upload";
            } else if (segment === "reports") {
                label = "Reports";
            } else if (segment === "companies") {
                label = "Companies";
            } else if (segment === "settings") {
                label = "Settings";
            } else if (segment === "team") {
                label = "Team";
            } else if (segment === "security") {
                label = "Security";
            }

            breadcrumbs.push({
                label,
                href: isLast ? undefined : currentPath,
                isActive: isLast
            });
        });

        return breadcrumbs;
    };

    const breadcrumbItems = items || generateBreadcrumbs();

    return (
        <nav
            className={cn(
                "flex items-center space-x-1 text-sm text-neutral-60",
                className
            )}
            aria-label="Breadcrumb"
        >
            <Link
                href="/portfolio"
                className="flex items-center hover:text-neutral-90 transition-colors"
            >
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
            </Link>

            {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mx-1 text-neutral-40" />
                    {item.href && !item.isActive ? (
                        <Link
                            href={item.href}
                            className="hover:text-neutral-90 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={cn(
                                "font-medium",
                                item.isActive ? "text-neutral-90" : "text-neutral-60"
                            )}
                        >
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}