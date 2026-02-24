export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-8 text-[#4CAF50] animate-pulse text-shadow">
          EduCraft
        </div>
        <div className="flex gap-2 justify-center">
          <div className="w-4 h-4 bg-[#4CAF50] animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-[#4CAF50] animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-[#4CAF50] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}
