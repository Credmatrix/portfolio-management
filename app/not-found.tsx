"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Custom404() {
	const router = useRouter();
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<Link
				className='flex cursor-pointer  gap-4 justify-center items-center hover:opacity-50'
				href='https://credmatrix.ai/'
				target='_blank'
				rel='noopener noreferrer'
			>
				<div className='text-4xl font-bold'>Credmatrix</div>
			</Link>
			<h1 className='text-2xl m-4'>404 - Page Not Found</h1>
			<p className='text-xl mb-8'>
				Oops! The page you&apos;re looking for doesn&apos;t exist.
			</p>
			<Button
				onClick={() => router.push("/portfolio")}
				className='rounded-md gap-4 px-4 py-2 text-white w-full'
			>
				Go back to Portfolio
			</Button>
		</div>
	);
}
