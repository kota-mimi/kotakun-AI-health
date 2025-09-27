import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Edit2 } from 'lucide-react';

interface ProfileData {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  targetDate: string;
  goal: string;
}

interface ProfileCardProps {
  profile: ProfileData;
  onEdit: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  return (
    <Card className="relative p-6 bg-white shadow-sm border border-gray-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="absolute top-4 right-4 p-2 h-auto w-auto text-gray-600 hover:text-gray-800"
      >
        <Edit2 size={16} />
      </Button>
      
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="w-16 h-16 bg-green-100">
          <AvatarFallback className="text-green-700 text-lg">
            {profile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-medium text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-600">{profile.age}歳 • {profile.gender}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">身長</p>
          <p className="text-sm font-medium">{profile.height}cm</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">体重</p>
          <p className="text-sm font-medium">{profile.weight}kg</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">目標体重</p>
          <p className="text-sm font-medium">{profile.targetWeight}kg</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">目標期限</p>
          <p className="text-sm font-medium">{profile.targetDate}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-500">目的</p>
        <p className="text-sm font-medium">{profile.goal}</p>
      </div>
    </Card>
  );
}