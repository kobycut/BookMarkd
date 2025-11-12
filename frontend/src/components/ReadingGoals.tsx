import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { AddGoalDialog, type GoalType } from './AddGoalDialog';
import { GoalCard } from './GoalCard';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { api } from '../api/client';


export interface Goal {
  id: number;
  description: string;
  type: GoalType;
  duration: string;
  progress: number;
  total: number;
  due_date: string;
}

export function ReadingGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const loadGoals = async () => {
    try {
      const data = await api.getGoals();
      const mapped = data.goals.map((g): Goal => ({
        id: g.id,
        description: g.description,
        type: g.type as GoalType,
        duration: g.duration,
        progress: g.progress,
        total: g.total,
        due_date: g.due_date,
      }));
      setGoals(mapped);
    } catch (err: any) {
      // Error already toasted by api client
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const updateGoalProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    try {
      await api.updateGoalProgress(editingGoal.id, Number(progressValue));
      toast.success("Goal updated");
      setEditingGoal(null);
      setProgressValue("");
      loadGoals();
    } catch (err: any) {
      // Error already toasted by api client
    }
  };

  const deleteGoal = async () => {
    if (!deletingGoal) return;

    try {
      await api.deleteGoal(deletingGoal.id);
      toast.success("Goal deleted");
      setDeletingGoal(null);
      loadGoals();
    } catch (err: any) {
      // Error already toasted by api client
    }
  };

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
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEditClick={(g, progressValue) => {
              setEditingGoal(g);
              setProgressValue(progressValue);
            }}
            onDeleteClick={(g) => setDeletingGoal(g)}
          />
        ))}
      </div>

      <AddGoalDialog
        open={showAddGoal}
        onOpenChange={(open) => {
          setShowAddGoal(open);
          if (!open) loadGoals();
        }}
      />

      {/* EDIT DIALOG */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Goal Progress</DialogTitle>
          </DialogHeader>

          <form onSubmit={updateGoalProgress} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Progress Value
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  type="number"
                  className="bg-gray-50 flex-1"
                  placeholder="Enter new progress"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  of {editingGoal?.total} {
                    editingGoal?.type.includes('book') ? 'books' :
                    editingGoal?.type.includes('page') ? 'pages' :
                    'hours'
                  }
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingGoal(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Goal?</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this goal?
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">{deletingGoal?.description}</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingGoal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteGoal}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

