import { useState } from 'react';
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

interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  status: 'read' | 'reading' | 'wishlist';
  rating?: number;
  progress?: number;
}

const mockBooks: Book[] = [
  {
    id: 1,
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover: 'https://images.unsplash.com/photo-1661936901394-a993c79303c7?w=300&h=450&fit=crop',
    status: 'read',
    rating: 5,
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=300&h=450&fit=crop',
    status: 'reading',
    progress: 65,
  },
  {
    id: 3,
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    cover: 'https://images.unsplash.com/photo-1660606422342-2ce59709bb14?w=300&h=450&fit=crop',
    status: 'reading',
    progress: 32,
  },
  {
    id: 4,
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300&h=450&fit=crop',
    status: 'wishlist',
  },
  {
    id: 5,
    title: 'Dune',
    author: 'Frank Herbert',
    cover: 'https://images.unsplash.com/photo-1661936901394-a993c79303c7?w=300&h=450&fit=crop',
    status: 'read',
    rating: 4,
  },
  {
    id: 6,
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    cover: 'https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=300&h=450&fit=crop',
    status: 'wishlist',
  },
];

export function BookList() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredBooks =
    activeTab === 'all'
      ? mockBooks
      : mockBooks.filter((book) => book.status === activeTab);

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
          <TabsTrigger value="all">All Books</TabsTrigger>
          <TabsTrigger value="reading">Currently Reading</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex gap-4 p-4">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <div className="w-24 h-36 rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
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
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Change Status</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
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
                  {book.progress !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900">{book.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-green-600 rounded-full transition-all"
                          style={{ width: `${book.progress}%` }}
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

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No books found in this category</p>
        </div>
      )}
    </div>
  );
}
