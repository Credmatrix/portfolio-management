"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useState, useEffect } from "react";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isMobile, setIsMobile] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Handle responsive behavior
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Close sidebar when clicking outside on mobile
	useEffect(() => {
		if (!isMobile) return;

		const handleClickOutside = (event: MouseEvent) => {
			const sidebar = document.getElementById('sidebar');
			const target = event.target as Node;

			if (sidebar && !sidebar.contains(target) && isSidebarOpen) {
				setIsSidebarOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isMobile, isSidebarOpen]);

	return (
		<AuthGuard requireAuth={true}>
			<ErrorBoundary>
				<div className="flex h-screen bg-neutral-10 overflow-hidden">
					{/* Mobile Sidebar Overlay */}
					{isMobile && isSidebarOpen && (
						<div
							className="fixed inset-0 bg-neutral-90 bg-opacity-50 z-40 lg:hidden"
							onClick={() => setIsSidebarOpen(false)}
						/>
					)}

					{/* Sidebar */}
					<div
						id="sidebar"
						className={`
						${isMobile ? 'fixed' : 'relative'} 
						${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
						transition-transform duration-300 ease-in-out z-50 lg:translate-x-0
					`}
					>
						<Sidebar />
					</div>

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col overflow-hidden min-w-0">
						<Header />

						{/* Main Content */}
						<main className="flex-1 overflow-y-auto bg-neutral-10">
							<div className="h-full">
								{children}
							</div>
						</main>
					</div>

					{/* Mobile Menu Button */}
					{isMobile && (
						<button
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-fluent-3 flex items-center justify-center z-30 lg:hidden hover:bg-primary-600 transition-colors"
							aria-label="Toggle menu"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					)}
				</div>
			</ErrorBoundary>
		</AuthGuard>
	);
}
