"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	useEffect(() => {
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
			api_host: "/ingest",
			ui_host: "https://us.posthog.com",
			defaults: '2025-05-24',
			capture_exceptions: true, // This enables capturing exceptions using Error Tracking
			debug: process.env.NODE_ENV === "development",
		});
	}, []);

	return (
		<PHProvider client={posthog}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</PHProvider>
	);
}