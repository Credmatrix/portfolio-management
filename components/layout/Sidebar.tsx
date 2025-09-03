"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Upload,
	FileText,
	BarChart3,
	Building2,
	Users,
	Settings,
	Shield,
	ChevronLeft,
	Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
	{
		name: "Portfolio Overview",
		href: "/portfolio",
		icon: LayoutDashboard,
		description: "View all companies and metrics"
	},
	{
		name: "Analytics",
		href: "/portfolio/analytics",
		icon: BarChart3,
		description: "Risk analysis and insights"
	},
	{
		name: "Create Request",
		href: "/upload",
		icon: Upload,
		description: "Process new company data"
	},
	// {
	// 	name: "Reports",
	// 	href: "/reports",
	// 	icon: FileText,
	// 	description: "Generate and download reports"
	// },
	// {
	// 	name: "Companies",
	// 	href: "/companies",
	// 	icon: Building2,
	// 	description: "Manage company profiles"
	// },
];

const secondaryNavigation = [
	// { name: "Team", href: "/team", icon: Users },
	// { name: "Settings", href: "/settings", icon: Settings },
	// { name: "Security", href: "/security", icon: Shield },
];

interface SidebarProps {
	className?: string;
}

export function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const isActiveRoute = (href: string) => {
		if (href === "/portfolio") {
			return pathname === "/portfolio" || pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<div className={cn(
			"bg-neutral-90 text-white h-screen flex flex-col transition-all duration-300",
			isCollapsed ? "w-16" : "w-64",
			className
		)}>
			{/* Header */}
			<div className="p-4 border-b border-neutral-80">
				<div className="flex items-center justify-between">
					{!isCollapsed && (
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
								<Building2 className="w-6 h-6" />
							</div>
							<div>
								<h2 className="font-bold text-white">Terra91</h2>
								<p className="text-xs text-neutral-40">Credit Portfolio</p>
							</div>
						</div>
					)}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="p-1.5 hover:bg-neutral-80 rounded-lg transition-colors"
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{isCollapsed ? (
							<Menu className="w-5 h-5" />
						) : (
							<ChevronLeft className="w-5 h-5" />
						)}
					</button>
				</div>
			</div>

			{/* Main Navigation */}
			<div className={cn(`flex-1 overflow-y-auto`, isCollapsed ? 'p-0' : 'p-4')}>
				<nav className="space-y-2">
					{!isCollapsed && (
						<div className="text-xs font-semibold text-neutral-40 uppercase tracking-wider mb-4">
							Portfolio Management
						</div>
					)}
					{navigation.map((item) => {
						const isActive = isActiveRoute(item.href);
						return (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
									isActive
										? "bg-primary-500 text-white shadow-fluent-1"
										: "hover:bg-neutral-80 text-neutral-30 hover:text-white"
								)}
								title={isCollapsed ? item.name : undefined}
							>
								<item.icon className={cn(
									"flex-shrink-0 transition-transform group-hover:scale-110",
									isCollapsed ? "w-6 h-6" : "w-5 h-5"
								)} />
								{!isCollapsed && (
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">{item.name}</div>
										<div className="text-xs text-neutral-40 truncate">
											{item.description}
										</div>
									</div>
								)}
							</Link>
						);
					})}
				</nav>

				{/* Secondary Navigation */}
				<div className="mt-8">
					{/* {!isCollapsed && (
						<div className="text-xs font-semibold text-neutral-40 uppercase tracking-wider mb-4">
							Administration
						</div>
					)} */}
					<nav className="space-y-1">
						{secondaryNavigation.map((item: any) => {
							const isActive = isActiveRoute(item.href);
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
										isActive
											? "bg-primary-500 text-white"
											: "hover:bg-neutral-80 text-neutral-40 hover:text-white"
									)}
									title={isCollapsed ? item.name : undefined}
								>
									<item.icon className={cn(
										"flex-shrink-0",
										isCollapsed ? "w-6 h-6" : "w-4 h-4"
									)} />
									{!isCollapsed && <span className="text-sm">{item.name}</span>}
								</Link>
							);
						})}
					</nav>
				</div>
			</div>

			{/* Footer */}
			{!isCollapsed && (
				<div className="p-4 border-t border-neutral-80">
					<div className="text-xs text-neutral-40">
						{/* <div className="font-medium">Portfolio Status</div> */}
						{/* <div className="mt-1">300+ Companies Analyzed</div> */}
						<div className="text-success">System Operational</div>
					</div>
				</div>
			)}
		</div>
	);
}
