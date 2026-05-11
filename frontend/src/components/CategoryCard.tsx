import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
}

const CategoryCard = ({ 
  title, 
  description, 
  icon: Icon, 
  imageUrl,
  onClick,
  className 
}: CategoryCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border border-border",
        "cursor-pointer card-hover",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400/30 to-amber-400/30" />
        )}
        {/* Overlay suave apenas para escurecer levemente e destacar o texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white drop-shadow-md">
            {title}
          </h3>
        </div>
        <p className="text-white/90 text-xs line-clamp-2 drop-shadow-md">
          {description}
        </p>
      </div>
    </div>
  );
};

export default CategoryCard;