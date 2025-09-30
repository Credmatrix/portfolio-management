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
	// {
	// 	name: "Analytics",
	// 	href: "/portfolio/analytics",
	// 	icon: BarChart3,
	// 	description: "Risk analysis and insights"
	// },
	// {
	// 	name: "Reports",
	// 	href: "/reports",
	// 	icon: FileText,
	// 	description: "Generate and download reports"
	// },
	{
		name: "Companies",
		href: "/companies",
		icon: Building2,
		description: "Manage company profiles"
	},
	// {
	// 	name: "Create Request",
	// 	href: "/upload",
	// 	icon: Upload,
	// 	description: "Process new company data"
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
	const [isCollapsed, setIsCollapsed] = useState(true);

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
							<div className="w-4 h-10 rounded-lg flex items-center justify-center">
								{/* <Building2 className="w-6 h-6" /> */}
							</div>
							<div>
								{typeof window !== 'undefined' && window.location.hostname === 'terra91.credmatrix.ai' ? (
									<svg xmlns="http://www.w3.org/2000/svg" width="143" height="39" viewBox="0 0 143 39" fill="none">
										<g clip-path="url(#clip0_677_96)">
											<path d="M8.47023 27.8434V5.57801H0V0.015625H22.582V5.57801H14.4337V27.8434H8.47023Z" fill="#F6F6F6"></path>
											<path d="M25.0312 27.8434V0.015625H45.1856V5.54106H30.9947V11.2248H43.5971V16.6289H30.9947V22.3179H45.1856V27.8434H25.0312Z" fill="#F6F6F6"></path>
											<path d="M48.0273 27.8436V0.0158234H60.3131C63.0416 0.0158234 65.3689 0.971033 67.2899 2.87617C69.2108 4.78659 70.1713 7.03477 70.1713 9.63653C70.1713 11.4414 69.6594 13.1091 68.6409 14.6448C67.6223 16.1805 66.2766 17.2835 64.6037 17.9432L70.5671 27.8436H64.2079L58.6824 18.6978H54.033V27.8436H48.0273ZM54.033 13.5312H60.3131C61.4531 13.5312 62.4188 13.1354 63.2157 12.3386C64.0126 11.5417 64.4084 10.5759 64.4084 9.43598C64.4084 8.29607 64.0126 7.33558 63.2157 6.55452C62.4188 5.77347 61.4531 5.38294 60.3131 5.38294H54.033V13.5312Z" fill="#F6F6F6"></path>
											<path d="M72.8203 27.8434V0.015625H85.1061C87.8345 0.015625 90.1619 0.970834 92.0828 2.87598C94.0038 4.7864 94.9643 7.03457 94.9643 9.63633C94.9643 11.4412 94.4524 13.1089 93.4338 14.6446C92.4153 16.1803 91.0696 17.2833 89.3966 17.943L95.3601 27.8434H89.0008L83.4754 18.6976H78.826V27.8434H72.8203ZM78.826 13.531H85.1061C86.246 13.531 87.2118 13.1352 88.0087 12.3384C88.8056 11.5415 89.2014 10.5757 89.2014 9.43579C89.2014 8.29587 88.8056 7.33538 88.0087 6.55433C87.2118 5.77327 86.246 5.38274 85.1061 5.38274H78.826V13.531Z" fill="#F6F6F6"></path>
											<path d="M118.276 27.8434H124.936L108.164 0.015625H97.4141V27.8434H103.42V18.2913H112.386L118.276 27.8434ZM103.42 13.1247V5.38274H104.422L109.199 13.1247H103.42Z" fill="#F6F6F6"></path>
											<path d="M134.637 1.83654C133.962 1.24019 133.17 0.786333 132.252 0.474966C131.334 0.158322 130.357 0 129.312 0C128.268 0 127.318 0.158322 126.399 0.474966C125.481 0.79161 124.684 1.24547 123.998 1.83654C123.317 2.43288 123.038 3.16116 122.642 4.02666C122.246 4.89215 122.051 5.86319 122.051 6.94506C122.051 7.87916 122.22 8.7341 122.563 9.49932C122.906 10.2645 123.101 10.9242 123.676 11.4731C124.251 12.0219 124.916 12.4441 125.671 12.7396C126.426 13.0352 127.228 13.1882 128.072 13.1882C128.289 13.1882 128.516 13.1724 128.758 13.1355C129.001 13.0985 129.223 13.0457 129.418 12.9719L129.365 13.051L124.61 19.6425H130.088L134.706 12.7555C135.334 11.8003 135.846 10.8609 136.242 9.93207C136.638 9.00325 136.833 7.97415 136.833 6.83951C136.833 5.79459 136.632 4.84993 136.242 4.00555C135.846 3.16116 135.313 2.43816 134.637 1.84181M131.487 8.9663C130.927 9.52571 130.194 9.80541 129.291 9.80541C128.389 9.80541 127.666 9.52043 127.122 8.95575C126.579 8.39107 126.31 7.67334 126.31 6.80785C126.31 5.88958 126.584 5.14547 127.138 4.58078C127.692 4.0161 128.426 3.73112 129.349 3.73112C130.273 3.73112 131.001 4.03193 131.534 4.63356C132.067 5.23518 132.336 5.95291 132.336 6.78146C132.336 7.6839 132.057 8.41218 131.497 8.97158" fill="#F6F6F6"></path>
											<path d="M142.825 0.511719H138.312V19.637H142.825V0.511719Z" fill="#F6F6F6"></path>
											<path d="M53.2578 38.9367V33.4746H55.6696C56.2026 33.4746 56.6617 33.6593 57.0417 34.034C57.4164 34.4087 57.6064 34.852 57.6064 35.3586C57.6064 35.8652 57.4217 36.3191 57.047 36.6727C56.6776 37.0263 56.2184 37.211 55.6696 37.2163H54.4347V38.9314H53.2578V38.9367ZM54.4347 36.1819H55.5904C55.8437 36.1766 56.0548 36.0922 56.2237 35.9233C56.3926 35.7544 56.4718 35.5592 56.4718 35.3217C56.4718 35.0842 56.3926 34.9048 56.2237 34.7517C56.0601 34.6039 55.849 34.5248 55.5851 34.5248H54.4294V36.1766L54.4347 36.1819Z" fill="#F6F6F6"></path>
											<path d="M62.888 38.1827C62.3391 38.7315 61.6794 39.0007 60.9089 39.0007C60.1384 39.0007 59.4788 38.7315 58.9352 38.188C58.3916 37.6444 58.1172 36.99 58.1172 36.2195C58.1172 35.449 58.3916 34.7893 58.9352 34.2457C59.484 33.6969 60.1384 33.4277 60.9089 33.4277C61.6794 33.4277 62.3338 33.7022 62.8774 34.2457C63.421 34.7893 63.6954 35.449 63.7007 36.2195C63.7007 36.9847 63.4315 37.6391 62.8827 38.188M59.7479 37.4175C60.0593 37.7446 60.4445 37.9082 60.9089 37.9082C61.3733 37.9082 61.7586 37.7446 62.07 37.4175C62.3813 37.0903 62.5344 36.6892 62.5344 36.2142C62.5344 35.7392 62.3813 35.3382 62.07 35.011C61.7586 34.6785 61.3733 34.5149 60.9089 34.5149C60.4445 34.5149 60.0645 34.6785 59.7532 35.011C59.4418 35.3434 59.2835 35.7445 59.2835 36.2142C59.2835 36.6839 59.4365 37.0903 59.7479 37.4175Z" fill="#F6F6F6"></path>
											<path d="M65.0827 38.9367L63.9375 33.4746H65.146L65.964 37.8285L66.8401 33.4746H68.5711L69.4102 37.8126L70.2334 33.4746H71.442L70.2968 38.9367H68.5605L67.7056 34.3401L66.8137 38.9367H65.0827Z" fill="#F6F6F6"></path>
											<path d="M72.1055 38.9367V33.4746H76.0582V34.5617H73.2718V35.6753H75.7469V36.736H73.2718V37.8548H76.0582V38.9367H72.1055Z" fill="#F6F6F6"></path>
											<path d="M76.8398 38.9367V33.4746H79.2516C79.7846 33.4746 80.2438 33.6646 80.6237 34.0393C80.9984 34.414 81.1884 34.8573 81.1884 35.3639C81.1884 35.7175 81.0882 36.0447 80.8876 36.3455C80.6871 36.6463 80.4232 36.8627 80.096 36.9946L81.2676 38.9367H80.0221L78.935 37.1424H78.022V38.9367H76.8451H76.8398ZM78.0167 36.1291H79.2516C79.4733 36.1291 79.6633 36.05 79.8216 35.8969C79.9799 35.7439 80.0538 35.5539 80.0538 35.327C80.0538 35.1001 79.9746 34.9153 79.8216 34.7623C79.6685 34.6093 79.4785 34.5301 79.2516 34.5301H78.0167V36.1291Z" fill="#F6F6F6"></path>
											<path d="M81.9258 38.9367V33.4746H85.8838V34.5618H83.0974V35.6753H85.5672V36.736H83.0974V37.8549H85.8838V38.9367H81.9258Z" fill="#F6F6F6"></path>
											<path d="M86.625 38.9467V33.4688H88.6937C89.4695 33.4688 90.1292 33.7326 90.6728 34.2656C91.2163 34.7987 91.4908 35.4425 91.496 36.2077C91.5013 36.9782 91.2322 37.6273 90.6886 38.1551C90.145 38.6828 89.4801 38.9467 88.6937 38.9467H86.625ZM87.8019 37.8543H88.6885C89.1845 37.8543 89.5803 37.6959 89.8864 37.3846C90.1925 37.0732 90.3456 36.6774 90.3456 36.2077C90.3456 35.738 90.1925 35.337 89.8864 35.0256C89.5803 34.7142 89.1793 34.5612 88.6937 34.5612H87.8071V37.8543H87.8019Z" fill="#F6F6F6"></path>
											<path d="M93.8686 38.9367V33.4746H96.4017C96.9189 33.4746 97.3305 33.6118 97.6419 33.8915C97.9533 34.1712 98.1116 34.5143 98.1116 34.9312C98.1116 35.1792 98.0535 35.4167 97.9374 35.6278C97.8213 35.8442 97.663 36.0183 97.4677 36.145C97.7633 36.2769 97.9849 36.4563 98.1327 36.6938C98.2752 36.9313 98.3491 37.1846 98.3491 37.4643C98.3491 37.8865 98.1908 38.2348 97.8741 38.5145C97.5575 38.7942 97.1353 38.9314 96.597 38.9314H93.8633L93.8686 38.9367ZM95.0032 35.7439H96.37C96.5548 35.7439 96.7078 35.6858 96.8239 35.5645C96.94 35.4431 96.9981 35.3006 96.9981 35.137C96.9981 34.9734 96.94 34.8256 96.8239 34.7095C96.7078 34.5881 96.5548 34.5301 96.37 34.5301H95.0032V35.7492V35.7439ZM95.0032 37.8865H96.5231C96.7131 37.8865 96.8608 37.8285 96.9822 37.7176C97.0983 37.6015 97.1564 37.4643 97.1564 37.2954C97.1564 37.1266 97.0983 36.9894 96.9822 36.868C96.8661 36.7519 96.7131 36.6938 96.5231 36.6938H95.0032V37.8865Z" fill="#F6F6F6"></path>
											<path d="M100.244 38.9367V37.2585L98.3867 33.4746H99.6375L100.825 35.9338L102.007 33.4746H103.258L101.427 37.2268V38.9367H100.244Z" fill="#F6F6F6"></path>
											<path d="M105.48 38.9367V37.7124L108.103 34.567H105.48V33.4746H109.57V34.4826L106.747 37.8549L109.491 37.8601V38.9367H105.48Z" fill="#F6F6F6"></path>
											<path d="M110.352 38.9367V33.4746H114.31V34.5618H111.523V35.6753H113.993V36.736H111.523V37.8549H114.31V38.9367H110.352Z" fill="#F6F6F6"></path>
											<path d="M116.592 38.9367V34.567H114.93V33.4746H119.363V34.567H117.764V38.9367H116.592Z" fill="#F6F6F6"></path>
											<path d="M121.096 38.9367L119.945 33.4746H121.159L121.977 37.8285L122.848 33.4746H124.584L125.423 37.8126L126.247 33.4746H127.455L126.305 38.9367H124.574L123.719 34.3401L122.827 38.9367H121.096Z" fill="#F6F6F6"></path>
											<path d="M128.113 38.9367V33.4746H132.071V34.5618H129.285V35.6753H131.76V36.736H129.285V37.8549H132.071V38.9367H128.113Z" fill="#F6F6F6"></path>
											<path d="M132.855 38.9367V33.4746H135.267C135.806 33.4746 136.259 33.6646 136.639 34.0393C137.014 34.414 137.204 34.8573 137.204 35.3639C137.204 35.7175 137.104 36.0447 136.903 36.3455C136.703 36.6463 136.439 36.8627 136.112 36.9946L137.283 38.9367H136.038L134.956 37.1424H134.043V38.9367H132.866H132.855ZM134.032 36.1291H135.267C135.489 36.1291 135.679 36.0499 135.837 35.8969C135.996 35.7439 136.069 35.5539 136.069 35.3269C136.069 35.1 135.99 34.9153 135.837 34.7623C135.679 34.6092 135.494 34.5301 135.267 34.5301H134.032V36.1291Z" fill="#F6F6F6"></path>
											<path d="M137.941 38.9367V33.4746H139.118V36.0183L141.319 33.4746H142.76L140.522 36.0025L142.823 38.9367H141.382L139.757 36.868L139.118 37.5963V38.9367H137.941Z" fill="#F6F6F6"></path>
										</g>
										<defs>
											<clipPath id="clip0_677_96">
												<rect width="142.822" height="39" fill="white"></rect>
											</clipPath>
										</defs>
									</svg>
								) : (
									<>
										<h2 className="font-bold text-white">
											{typeof window !== 'undefined' && window.location.hostname === 'app.credmatrix.ai'
												? 'CREDMATRIX'
												: 'CREDMATRIX'}
										</h2>
										<p className="text-xs text-neutral-40">Credit Portfolio</p>
									</>
								)}
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
