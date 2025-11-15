import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { MoreVertical } from 'lucide-react';
// @ts-ignore (necessary because there is no @types/react-stars package)
import ReactStars from 'react-stars';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { api } from '../api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'react-hot-toast';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface Book {
  id: number;
  title: string;
  author: string;
  open_library_id?: string;
  status: 'read' | 'reading' | 'wishlist';
  rating?: number;
  page_progress: number;
  total_pages: number;
}

export const BookList = forwardRef(function BookList(_props, ref) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [progressDialogBook, setProgressDialogBook] = useState<Book | null>(null);
  const [progressInput, setProgressInput] = useState<string>('');
  const [progressLoading, setProgressLoading] = useState(false);

  const loadBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      // Error already toasted by api client
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    await api.deleteBook(deletingBook.id);
    toast.success('Book deleted');
    setDeletingBook(null);
    loadBooks();
  };

  const handleUpdateRating = async (book: Book, newRating: number) => {
    if (book.status !== 'read') return;
    try {
      await api.updateBookRating(book.id, newRating as number);
      toast.success('Rating updated');
      loadBooks();
    } catch (err) {
      // Error already toasted by api client
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressDialogBook) return;
    const page_progress = parseInt(progressInput, 10);
    if (isNaN(page_progress) || page_progress < 0 || page_progress > progressDialogBook.total_pages) {
      toast.error('Please enter a valid page number between 0 and ' + progressDialogBook.total_pages);
      return;
    }
    setProgressLoading(true);
    try {
      await api.updateBookProgress(progressDialogBook.id, page_progress);
      toast.success('Progress updated');
      setProgressDialogBook(null);
      setProgressInput('');
      loadBooks();
    } catch (err) {
      // Error already toasted by api client
    } finally {
      setProgressLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadBooks,
  }));

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks =
    activeTab === 'all'
      ? books
      : books.filter((book) => book.status === activeTab);

  const statusBadge = (status: Book['status']) => {
    const variants = {
      read: 'bg-green-100 text-green-700 border-green-200',
      reading: 'bg-blue-100 text-blue-700 border-blue-200',
      wishlist: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const labels = {
      read: 'Read',
      reading: 'Currently Reading',
      wishlist: 'Wishlist',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start bg-gray-100">
          <TabsTrigger className="hover:cursor-pointer" value="all">All Books</TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="reading">Currently Reading</TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="read">Read</TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="wishlist">Wishlist</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading your books...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex gap-4 p-4">
                  {/* Book Cover */}
                  <div className="shrink-0">
                    <div className="w-24 h-36 overflow-hidden bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      {book.open_library_id ? (
                        <img
                          src={
                            book.open_library_id.startsWith("OL")
                              ? `https://covers.openlibrary.org/b/olid/${book.open_library_id}-M.jpg`
                              : `https://covers.openlibrary.org/b/id/${book.open_library_id}-M.jpg`
                          }
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white text-xl font-bold text-center px-2 line-clamp-3">
                          {book.title}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 truncate">{book.title}</h3>
                        <p className="text-gray-600 text-sm truncate">{book.author}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreVertical className="w-5 h-5 hover:cursor-pointer" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => setProgressDialogBook(book)}>
                            Update Pages Read
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 hover:cursor-pointer"
                            onClick={() => setDeletingBook(book)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      {statusBadge(book.status)}

                      {/* Rating: Only show for read books */}
                      {book.status === 'read' && (
                        <div className="flex items-center gap-1">
                          <ReactStars
                            count={5}
                            onChange={(newRating: number) => handleUpdateRating(book, newRating)}
                            size={24}
                            color="#d1d5db"
                            activeColor="#facc15"
                            value={book.rating ?? 0}
                            half={true}
                          />
                        </div>
                      )}

                      {/* Progress Bar for incomplete books */}
                      {book.page_progress !== undefined && book.status !== 'read' && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900">
                              {book.page_progress} / {book.total_pages} pages
                              {' '}(
                              {Math.round((book.page_progress / book.total_pages) * 100)}%
                              )
                            </span>
                          </div>
                          <Progress
                            value={Math.round((book.page_progress / book.total_pages) * 100)}
                            className={`h-2 ${book.page_progress === book.total_pages ? '[&>div]:bg-green-700' : '[&>div]:bg-linear-to-r [&>div]:from-blue-600 [&>div]:to-green-600'}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Update Progress Dialog */}
          <Dialog open={!!progressDialogBook} onOpenChange={() => { setProgressDialogBook(null); setProgressInput(''); }}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Update Pages Read</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600 mb-2">
                  Enter the number of pages you've read for <span className="font-medium">{progressDialogBook?.title}</span>.
                </p>
                <input
                  type="number"
                  min={0}
                  max={progressDialogBook?.total_pages ?? 1000}
                  value={progressInput}
                  onChange={e => setProgressInput(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring"
                  placeholder={`0 - ${progressDialogBook?.total_pages}`}
                  disabled={progressLoading}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setProgressDialogBook(null); setProgressInput(''); }}
                  className="flex-1"
                  disabled={progressLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateProgress}
                  className="flex-1 text-white bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  disabled={progressLoading}
                >
                  {progressLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deletingBook} onOpenChange={() => setDeletingBook(null)}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Delete Book?</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this book?
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{deletingBook?.title}</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingBook(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteBook}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No books found in this category</p>
            </div>
          )}
        </>
      )}
    </div>
  );
});
