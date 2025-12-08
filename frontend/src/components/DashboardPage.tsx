import { useOutletContext } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { BookList } from './BookList';
import { ReadingGoals } from './ReadingGoals';

interface DashboardContext {
  bookListRef: React.RefObject<{ loadBooks: () => Promise<void> }>;
  showAddBook: boolean;
  setShowAddBook: (show: boolean) => void;
  handleBookAdded: () => void;
}

export function DashboardPage() {
  const { bookListRef, setShowAddBook } = useOutletContext<DashboardContext>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - My Books */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">My Books</h2>
          <Button
            onClick={() => setShowAddBook(true)}
            className="bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Book
          </Button>
        </div>
        <BookList ref={bookListRef} />
      </div>

      {/* Right Column - Reading Goals */}
      <div className="lg:col-span-1">
        <ReadingGoals />
      </div>
    </div>
  );
}

