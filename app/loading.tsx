import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className='flex size-full flex-col items-center justify-center'>
			<Loader2 className='mt-4 size-12 animate-spin' />
		</div>
	);
}
