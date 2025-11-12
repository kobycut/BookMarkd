import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import toast from 'react-hot-toast';

  const API_URL = (import.meta.env.VITE_API_URL || '');

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type GoalType = 'books read' | 'pages read' | 'hours read';
type GoalDuration = 'this week' | 'this month' | 'this year';

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const [type, setType] = useState<GoalType>('books read');
  const [amount, setAmount] = useState<number | ''>('');
  const [duration, setDuration] = useState<GoalDuration>('this month');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !type || !duration) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: Number(amount),
          type,
          duration,
        }),
      });
      if (!res.ok) {
        toast.error('Failed to create goal');
        return;
      }

      onOpenChange(false);
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Reading Goal</DialogTitle>
          <DialogDescription>
            Set a new reading goal to track your progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as GoalType)}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="books read">Number of Books</SelectItem>
                <SelectItem value="pages read">Number of Pages</SelectItem>
                <SelectItem value="hours read">Reading Time (hours)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : '')
              }
              className="bg-gray-50"
              placeholder="Enter target value"
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={(value) => setDuration(value as GoalDuration)}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this week">This Week</SelectItem>
                <SelectItem value="this month">This Month</SelectItem>
                <SelectItem value="this year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
