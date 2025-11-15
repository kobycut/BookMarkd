import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { MoreVertical, Star } from 'lucide-react';
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
                        // this is handling different types of open library cover IDs
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
                      <DropdownMenuItem className="hover:cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem className="hover:cursor-pointer">Change Status</DropdownMenuItem>
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

                  {/* Rating */}
                  {book.rating && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < book.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {book.page_progress !== undefined && book.status === 'reading' && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900">
                          {Math.round((book.page_progress / book.total_pages) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-600 to-green-600 rounded-full transition-all"
                          style={{
                            width: `${Math.round(
                              (book.page_progress / book.total_pages) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
