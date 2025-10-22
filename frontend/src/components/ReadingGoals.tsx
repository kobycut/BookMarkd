import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Plus, Target, Calendar, BookOpen } from 'lucide-react';
import { AddGoalDialog } from './AddGoalDialog';

interface Goal {
  id: number;
  title: string;
  type: 'books' | 'pages' | 'time';
  current: number;
  target: number;
  period: string;
  icon: typeof BookOpen;
}

const mockGoals: Goal[] = [
  {
    id: 1,
    title: 'Read 24 books this year',
    type: 'books',
    current: 15,
    target: 24,
    period: '2025',
    icon: BookOpen,
  },
  {
    id: 2,
    title: 'Read 500 pages this month',
    type: 'pages',
    current: 324,
    target: 500,
    period: 'October',
    icon: Target,
  },
  {
    id: 3,
    title: 'Read 2 hours this week',
    type: 'time',
    current: 1.5,
    target: 2,
    period: 'This week',
    icon: Calendar,
  },
];

export function ReadingGoals() {
  const [showAddGoal, setShowAddGoal] = useState(false);

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // const getProgressColor = (percentage: number) => {
  //   if (percentage >= 80) return 'bg-green-600';
  //   if (percentage >= 50) return 'bg-blue-600';
  //   return 'bg-gray-400';
  // };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">Reading Goals</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddGoal(true)}
          className="border-gray-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {mockGoals.map((goal) => {
          const percentage = getProgressPercentage(goal.current, goal.target);
          const Icon = goal.icon;

          return (
            <Card key={goal.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1">{goal.title}</h3>
                  <p className="text-sm text-gray-500">{goal.period}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">
                    {goal.type === 'time'
                      ? `${goal.current.toFixed(1)}h / ${goal.target}h`
                      : `${goal.current} / ${goal.target}`}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-gray-500 text-right">
                  {percentage.toFixed(0)}% complete
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Insights Card */}
      <Card className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <h3 className="text-gray-900 mb-3">This Month</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Books completed</span>
            <span className="text-gray-900">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pages read</span>
            <span className="text-gray-900">847</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reading time</span>
            <span className="text-gray-900">12.5 hrs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current streak</span>
            <span className="text-gray-900">7 days 🔥</span>
          </div>
        </div>
      </Card>

      <AddGoalDialog open={showAddGoal} onOpenChange={setShowAddGoal} />
    </div>
  );
}
