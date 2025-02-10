
import { cn } from '@/lib/utils';

interface MerchantCardProps {
  property: {
    id: string;
    address: string;
    type: string;
    inspector: string;
    date: string;
    status: 'inspected' | 'inspection required';
  };
  isSelected: boolean;
  onClick: () => void;
}

export const MerchantCard = ({ property, isSelected, onClick }: MerchantCardProps) => {
  return (
    <div
      id={`property-card-${property.id}`}
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg backdrop-blur-lg border cursor-pointer transition-all duration-300",
        "hover:translate-y-[-2px] hover:shadow-lg",
        isSelected
          ? "bg-white/15 border-white/30 shadow-lg"
          : "bg-white/10 border-white/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full",
              property.status === 'inspected'
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-pink-500/20 text-pink-300"
            )}>
              {property.status}
            </span>
            <span className="text-xs text-white/50">{property.id}</span>
          </div>
          <h3 className="text-white font-medium">{property.address}</h3>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-white/50">TYPE</p>
          <p className="text-white">{property.type}</p>
        </div>
        <div>
          <p className="text-white/50">INSPECTOR</p>
          <p className="text-white">{property.inspector}</p>
        </div>
        <div>
          <p className="text-white/50">DATE</p>
          <p className="text-white">{property.date}</p>
        </div>
      </div>
    </div>
  );
};