const sizes = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12'
}

export default function LoadingSpinner({ size = 'medium' }) {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${sizes[size]}
          border-4 border-gray-200 border-t-primary-600
          rounded-full animate-spin
        `}
      />
    </div>
  )
}
