import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-hot-toast';
import { api } from '@/api/client';

// some of these fields are strangely named, but they match the JSON response from Open Library
interface OpenLibraryBook {
  key: string;
  title: string;
  edition_key?: string;
  author_name?: string[];
  cover_i: number;
  cover_edition_key?: string;
}

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: () => void;
}

export function AddBookDialog({ open, onOpenChange, onBookAdded }: AddBookDialogProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [editions, setEditions] = useState<OpenLibraryBook[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedEdition, setSelectedEdition] = useState<OpenLibraryBook | null>(null);
  const [selectedPageCount, setSelectedPageCount] = useState<number | null>(null);
  const [manualPagesDialogOpen, setManualPagesDialogOpen] = useState(false);
  const [manualPageCount, setManualPageCount] = useState<number | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const submitBook = async () => {
    if (!selectedEdition) return;

    const pageCount = selectedPageCount ?? manualPageCount;
    const pagesRead = 0;

    const authors = selectedEdition.author_name?.join(', ') ?? 'Unknown author';

    await api.createBook(
      selectedEdition.title,
      authors,
      pagesRead,
      pageCount ?? 0,
      selectedEdition.key
    );
    toast.success('Book added');
    onBookAdded();

    onOpenChange(false);
  };


  const handleAddBook = () => {
    if (!selectedPageCount) {
      setManualPagesDialogOpen(true);
    } else {
      submitBook();
    }
  };


  const handleSearch = async () => {
    const isbnValidLength = isbn.trim().length == 13 || isbn.trim().length == 10;
    if (!title && !author && !isbnValidLength) return;

    // prefer searching by ISBN if provided and valid length
    if (isbnValidLength) {
      // Use the Open Library Books API to get richer data for ISBNs
      // jscmd=data returns author names, covers and page counts when available
      try {
        const res = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn.trim()}&format=json&jscmd=data`
        );
        const json = await res.json();
        const bookKey = `ISBN:${isbn.trim()}`;
        const bookData = json[bookKey];
        if (bookData) {
          // normalize into our OpenLibraryBook shape
          const olId = (bookData.identifiers && bookData.identifiers.openlibrary && bookData.identifiers.openlibrary[0]) || '';
          const edition = {
            key: olId || (bookData.key ?? bookKey),
            title: bookData.title,
            edition_key: bookData.identifiers?.edition_key ?? undefined,
            author_name: bookData.authors ? bookData.authors.map((a: any) => a.name).filter(Boolean) : undefined,
            cover_i: bookData.cover && bookData.cover.id ? bookData.cover.id : (bookData.cover_edition_key ?? 0),
            cover_edition_key: olId || undefined,
          } as OpenLibraryBook;

          setEditions([edition]);
          // If the books API provided a page count, prefill selectedPageCount for convenience
          if (bookData.number_of_pages) setSelectedPageCount(bookData.number_of_pages);
          setPageIndex(0);
          return;
        }
      } catch (err) {
        toast.error('Failed to get book data by ISBN. Please try again with verified ISBN or other details.');
      }
    } else {
      const params = new URLSearchParams();
      if (title) params.append('title', title);
      if (author) params.append('author', author);
      params.append('limit', '50');
      
      const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
      const data = await res.json();
      setEditions(data.docs);
      setPageIndex(0);
    }
  };

  const changePage = (delta: number) => {
    setSelectedEdition(null);
    setSelectedPageCount(null);
    setPageIndex((i) => {
      const next = i + delta;
      return Math.max(0, Math.min(next, Math.floor(editions.length / 5)));
    });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const currentPage = editions.slice(pageIndex * 5, pageIndex * 5 + 5);

  useEffect(() => {
    if (!selectedEdition) {
      setSelectedPageCount(null);
      return;
    }

    const fetchEditionDetails = async () => {
      // this check is to ensure we only fetch for valid edition keys. Some keys
      // in Open Library are "work" keys which don't have page count info
      if (selectedEdition.key.startsWith('OL') && selectedEdition.key.endsWith('M')) {
        try {
          const res = await fetch(`https://openlibrary.org/books/${selectedEdition.key}.json`);
          const data = await res.json();
          const pages = data.number_of_pages ?? null;
          setSelectedPageCount(pages);
        } catch (err) {
          console.error('Failed to fetch edition details:', err);
          setSelectedPageCount(null);
        }
      }
    };

    fetchEditionDetails();
  }, [selectedEdition]);


  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
          <DialogDescription>
            Add a book to your reading collection. Search by title/author or ISBN.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddBook} className="space-y-5 mt-4">
          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="book-title">Title</Label>
              <Input
                id="book-title"
                placeholder="Enter book title"
                className="bg-gray-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                className="bg-gray-50"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                placeholder="Enter ISBN"
                className="bg-gray-50 flex-1"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!title.trim() && !author.trim() && !(isbn.trim().length == 13) && !(isbn.trim().length == 10)}
                onClick={handleSearch}
              >
                Search Books
              </Button>
            </div>
          </div>

          {editions.length > 0 && (
            <div ref={scrollRef} className="border rounded p-2 h-65 overflow-y-auto">
              {currentPage.map((edition) => {
                // resolve edition ID: prefer cover_edition_key or edition_key (to get page number info)
                edition.key = edition.cover_edition_key ?? edition.edition_key?.[0] ?? edition.cover_i?.toString();
                return (
                  <div
                    key={edition.key}
                    className={`flex flex-col gap-1 mb-3 p-2 rounded cursor-pointer 
                      ${selectedEdition?.key === edition.key ? 'border-2 border-blue-600 bg-blue-50' : 'border border-transparent'}
                    `}
                    onClick={() => {
                      setSelectedPageCount(null);
                      setSelectedEdition(edition);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {edition.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${edition.cover_i}-M.jpg`}
                          alt={edition.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 flex items-center justify-center text-xs rounded">
                          No Cover
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{edition.title}</div>
                        <div className="text-sm text-gray-500">{edition.author_name?.join(', ')}</div>
                      </div>
                    </div>

                    {selectedEdition?.key === edition.key && selectedPageCount !== null && (
                      <div className="text-xs text-gray-400">Pages: {selectedPageCount}</div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changePage(-1)}
                  disabled={pageIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changePage(1)}
                  disabled={pageIndex >= Math.floor(editions.length / 5)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              disabled={!selectedEdition}
              onClick={() => handleAddBook()}
            >
              Add Book
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={manualPagesDialogOpen} onOpenChange={setManualPagesDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Enter Page Count</DialogTitle>
          <DialogDescription>
            Please enter the page count for this book.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Input
            type="number"
            min={1}
            placeholder="Number of pages"
            value={manualPageCount ?? ''}
            onChange={(e) => setManualPageCount(Number(e.target.value))}
            className="bg-gray-50"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualPagesDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!manualPageCount || manualPageCount <= 0}
              className="flex-1 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              onClick={() => {
                if (manualPageCount && manualPageCount > 0) {
                  submitBook();
                  setManualPagesDialogOpen(false);
                }
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
