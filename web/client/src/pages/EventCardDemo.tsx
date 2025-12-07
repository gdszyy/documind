import EventCard from "@/components/EventCard";

export default function EventCardDemo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-8">
      <div className="w-full max-w-[1000px] flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Event Card Component Demo</h1>
          <p className="text-gray-600">
            Pixel-perfect implementation of the Figma design with Swiss Style principles.
          </p>
        </div>
        
        {/* Component Demo */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Live Match State</h2>
          <EventCard />
        </div>

        {/* Background Context Demo */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Context: Dark Background</h2>
          <div className="p-8 bg-[#1a1a1a] rounded-xl">
            <EventCard />
          </div>
        </div>
      </div>
    </div>
  );
}
