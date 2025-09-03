"use client";

import { Bell, Search, LogOut, Settings, HelpCircle, ChevronDown,Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { useRouter, usePathname } from 'next/navigation'

interface NotificationItem {
	id: string;
	title: string;
	message: string;
	time: string;
	isRead: boolean;
	type: 'info' | 'warning' | 'success' | 'error';
}

export function Header() {
	const { user, signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const dropdownRef = useRef<HTMLDivElement>(null);
	const notificationsRef = useRef<HTMLDivElement>(null);

	// Mock notifications data
	const notifications: NotificationItem[] = [
		{
			id: '1',
			title: 'Risk Alert',
			message: 'Company ABC Ltd risk score updated to CM4',
			time: '2 minutes ago',
			isRead: false,
			type: 'warning'
		},
		{
			id: '2',
			title: 'Processing Complete',
			message: '5 new companies processed successfully',
			time: '1 hour ago',
			isRead: false,
			type: 'success'
		},
		{
			id: '3',
			title: 'System Update',
			message: 'Portfolio analytics updated with latest data',
			time: '3 hours ago',
			isRead: true,
			type: 'info'
		}
	];

	const unreadCount = notifications.filter(n => !n.isRead).length;

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
			if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
				setIsNotificationsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSignOut = async () => {
		setIsDropdownOpen(false);
		await signOut();
	};

	const getUserDisplayName = () => {
		if (user?.user_metadata?.full_name) {
			return user.user_metadata.full_name;
		}
		if (user?.email) {
			return user.email.split('@')[0];
		}
		return 'User';
	};

	const getUserInitials = () => {
		const name = getUserDisplayName();
		return name
			.split(' ')
			.map((word: string) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const getNotificationIcon = (type: NotificationItem['type']) => {
		const baseClasses = "w-2 h-2 rounded-full";
		switch (type) {
			case 'error':
				return <div className={`${baseClasses} bg-error`} />;
			case 'warning':
				return <div className={`${baseClasses} bg-warning`} />;
			case 'success':
				return <div className={`${baseClasses} bg-success`} />;
			default:
				return <div className={`${baseClasses} bg-info`} />;
		}
	};

	return (
		<header className="bg-white border-b border-neutral-20 shadow-fluent-1 sticky top-0 z-30">
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Search and Breadcrumbs */}
					<div className="flex items-center gap-6 flex-1">
						{/* <div className="relative max-w-md w-full">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-50" />
							<input
								type="search"
								placeholder="Search companies, risk scores, industries..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2.5 bg-neutral-10 border border-neutral-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-neutral-50"
							/>
						</div> */}

						<div className="hidden lg:block">
							<Breadcrumbs />
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Help Button */}
						{!pathname.includes('/upload') && <Button
							variant="primary"
							onClick={() => router.push('/upload')}
						>
							<Plus className="w-4 h-4 mr-2" />
							Create Credit Request
						</Button>
}
						<button
							className="p-2 hover:bg-neutral-10 rounded-lg transition-colors"
							title="Help & Documentation"
						>
							<HelpCircle className="w-5 h-5 text-neutral-70" />
						</button>

						{/* Notifications */}
						<div className="relative" ref={notificationsRef}>
							<button
								onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
								className="p-2 hover:bg-neutral-10 rounded-lg relative transition-colors"
								title="Notifications"
							>
								<Bell className="w-5 h-5 text-neutral-70" />
								{unreadCount > 0 && (
									<span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-medium">
										{unreadCount > 9 ? '9+' : unreadCount}
									</span>
								)}
							</button>

							{isNotificationsOpen && (
								<div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-fluent-3 border border-neutral-20 z-40">
									<div className="p-4 border-b border-neutral-20">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-neutral-90">Notifications</h3>
											{unreadCount > 0 && (
												<span className="text-xs text-neutral-60">
													{unreadCount} unread
												</span>
											)}
										</div>
									</div>
									<div className="max-h-96 overflow-y-auto">
										{notifications.map((notification) => (
											<div
												key={notification.id}
												className={`p-4 border-b border-neutral-10 hover:bg-neutral-10 transition-colors ${!notification.isRead ? 'bg-primary-50' : ''
													}`}
											>
												<div className="flex items-start gap-3">
													{getNotificationIcon(notification.type)}
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between">
															<h4 className="text-sm font-medium text-neutral-90 truncate">
																{notification.title}
															</h4>
															<span className="text-xs text-neutral-50 ml-2">
																{notification.time}
															</span>
														</div>
														<p className="text-sm text-neutral-60 mt-1">
															{notification.message}
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
									<div className="p-3 border-t border-neutral-20">
										<button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
											View all notifications
										</button>
									</div>
								</div>
							)}
						</div>

						{/* User Menu */}
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className="flex items-center gap-3 p-2 hover:bg-neutral-10 rounded-lg transition-colors"
							>
								<div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
									{getUserInitials()}
								</div>
								<div className="text-left hidden sm:block">
									<div className="text-sm font-medium text-neutral-90">
										{getUserDisplayName()}
									</div>
									<div className="text-xs text-neutral-60">
										{user?.email}
									</div>
								</div>
								<ChevronDown className="w-4 h-4 text-neutral-50" />
							</button>

							{isDropdownOpen && (
								<div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-fluent-3 border border-neutral-20 z-40">
									<div className="p-4 border-b border-neutral-20">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
												{getUserInitials()}
											</div>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-neutral-90 truncate">
													{getUserDisplayName()}
												</div>
												<div className="text-xs text-neutral-60 truncate">
													{user?.email}
												</div>
											</div>
										</div>
									</div>
									<div className="py-2">
										<button
											onClick={() => setIsDropdownOpen(false)}
											className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-neutral-70 hover:bg-neutral-10 transition-colors"
										>
											<Settings className="w-4 h-4" />
											Account Settings
										</button>
										<button
											onClick={handleSignOut}
											className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-neutral-70 hover:bg-neutral-10 transition-colors"
										>
											<LogOut className="w-4 h-4" />
											Sign Out
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Breadcrumbs */}
			<div className="lg:hidden px-6 pb-4">
				<Breadcrumbs />
			</div>
		</header>
	);
}