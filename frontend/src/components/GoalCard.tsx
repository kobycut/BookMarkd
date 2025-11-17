import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Target, Calendar, BookOpen, Check, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Goal } from './ReadingGoals';

interface GoalCardProps {
  goal: Goal;
  onEditClick: (goal: Goal, progressValue: string) => void;
  onDeleteClick: (goal: Goal) => void;
}

const isOverdue = (dueDate: string, isComplete: boolean) => {
  if (isComplete) return false;
  return new Date() > new Date(dueDate);
};

const getIcon = (type: string) => {
  if (type.includes('book')) return BookOpen;
  if (type.includes('page')) return Target;
  return Calendar;
};

const getProgressPercentage = (current: number, target: number) => {
  return Math.min((current / target) * 100, 100);
};

export function GoalCard({ goal, onEditClick, onDeleteClick }: GoalCardProps) {
  const percentage = getProgressPercentage(goal.progress, goal.total);
  const isComplete = goal.progress >= goal.total;
  const overdue = isOverdue(goal.due_date, isComplete);
  const Icon = getIcon(goal.type);

  return (
    <Card
      className={`p-5 hover:shadow-md transition-shadow ${
        isComplete
          ? 'bg-green-50 border-green-200'
          : overdue
            ? 'bg-red-50 border-red-200'
            : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isComplete
                ? 'bg-green-100'
                : overdue
                  ? 'bg-red-100'
                  : 'bg-linear-to-br from-blue-100 to-green-100'
            }`}
          >
            {isComplete ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : overdue ? (
              <Calendar className="w-5 h-5 text-red-600" />
            ) : (
              <Icon className="w-5 h-5 text-blue-700" />
            )}
          </div>
          <div>
            <h3 className="text-gray-900">{goal.description}</h3>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreVertical className="w-5 h-5 hover:cursor-pointer" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onClick={() => onEditClick(goal, String(goal.progress))}
            >
              Edit Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:cursor-pointer text-red-600"
              onClick={() => onDeleteClick(goal)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span
            className={`${
              isComplete
                ? 'text-green-600 font-medium'
                : overdue
                  ? 'text-red-600 font-medium'
                  : 'text-gray-600'
            }`}
          >
            Progress
          </span>
          <span
            className={`${
              isComplete
                ? 'text-green-600 font-medium'
                : overdue
                  ? 'text-red-600 font-medium'
                  : 'text-gray-900'
            }`}
          >
            {goal.type.includes('hour')
              ? `${goal.progress}h / ${goal.total}h`
              : `${goal.progress} / ${goal.total}`}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={`h-2 ${isComplete ? '[&>div]:bg-green-700' : '[&>div]:bg-linear-to-r [&>div]:from-blue-600 [&>div]:to-green-600'}`}
        />
        <p
          className={`text-xs text-right ${
            isComplete
              ? 'text-green-600 font-medium'
              : overdue
                ? 'text-red-600 font-medium'
                : 'text-gray-500'
          }`}
        >
          {isComplete ? '✓ Complete!' : overdue ? '⚠ Overdue' : `${percentage.toFixed(0)}% complete`}
        </p>
      </div>
    </Card>
  );
}
