import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronRight, Scale, Utensils, Bot, Calendar, Target } from 'lucide-react';

interface InfoSectionProps {
  title: string;
  value?: string;
  subtitle?: string;
  icon: 'weight' | 'meal' | 'ai' | 'schedule' | 'target';
  onClick?: () => void;
}

const iconMap = {
  weight: Scale,
  meal: Utensils,
  ai: Bot,
  schedule: Calendar,
  target: Target,
};

export function InfoSection({ title, value, subtitle, icon, onClick }: InfoSectionProps) {
  const IconComponent = iconMap[icon];
  
  return (
    <Card className="p-4 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        className="w-full h-auto p-0 justify-start text-left"
        onClick={onClick}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <IconComponent size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              {value && (
                <p className="text-lg font-semibold text-gray-800 mt-1">{value}</p>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </Button>
    </Card>
  );
}