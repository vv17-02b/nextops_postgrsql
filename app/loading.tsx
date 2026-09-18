export default function Loading() {
	return (
		<div className='fixed inset-0 flex items-center justify-center bg-[#1f242c]'>
			<div className='flex flex-col items-center gap-6'>
				{/* Spinner */}
				<div className='relative w-16 h-16'>
					<div className='absolute inset-0 rounded-full border-4 border-blue-500/30'></div>
					<div className='absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin'></div>
				</div>

				{/* Text */}
				<p className='text-white text-sm tracking-widest animate-pulse'>
					LOADING
				</p>
			</div>
		</div>
	)
}
