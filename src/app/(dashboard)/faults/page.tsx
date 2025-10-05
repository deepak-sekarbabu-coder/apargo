import { FaultView } from '@/components/fault-reporting/fault-view';

export default function FaultsPage() {
  return (
    <div className="flex justify-center items-start py-6 px-2 sm:px-4 min-h-[80vh]">
      <div className="w-full max-w-7xl">
        <FaultView />
      </div>
    </div>
  );
}
