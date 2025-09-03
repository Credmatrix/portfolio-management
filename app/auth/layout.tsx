import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AuthGuard requireAuth={false}>
			<div className='min-h-screen bg-gradient-to-br from-primary-50 to-primary-100'>
				{children}
			</div>
		</AuthGuard>
	);
}
