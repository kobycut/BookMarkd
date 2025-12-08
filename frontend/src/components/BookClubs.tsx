import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api } from '../api/client';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Club {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Post {
  id: number;
  author: string;
  body: string;
  created_at: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  author: string;
  body: string;
  created_at: string;
}

const formatLocalTime = (utcTimestamp: string): string => {
  // Ensure the timestamp is treated as UTC by appending 'Z' if no timezone is present
  // The backend returns timestamps like "2025-12-08T19:22:04" without timezone info
  // We need to explicitly mark it as UTC so JavaScript converts it to local time
  let timestamp = utcTimestamp.trim();
  
  // Check if it already has a timezone indicator
  const hasTimezone = timestamp.includes('Z') || 
                      timestamp.includes('+') || 
                      (timestamp.match(/[-+]\d{2}:\d{2}$/) !== null);
  
  // If no timezone, append 'Z' to indicate UTC
  if (!hasTimezone) {
    timestamp = timestamp + 'Z';
  }
  
  // Parse the UTC timestamp and convert to local time
  const date = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    // Fallback: try parsing without 'Z' as a last resort
    return new Date(utcTimestamp).toLocaleString();
  }
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export function BookClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [clubFilter, setClubFilter] = useState<'joined' | 'available'>('available');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const perPage = 10;
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [creatingClub, setCreatingClub] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postingComments, setPostingComments] = useState<Set<number>>(new Set());

  // Load clubs and user's memberships
  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true);
        const [allClubs, userClubs] = await Promise.all([
          api.getClubs(),
          api.getMyClubs().catch(() => []), // If not authenticated, return empty array
        ]);
        setClubs(allClubs);
        setMyClubs(new Set(userClubs.map(c => c.id)));
        if (allClubs.length > 0 && !selectedClub) {
          setSelectedClub(allClubs[0]);
        }
      } catch (err) {
        // Error already toasted by api client
      } finally {
        setLoading(false);
      }
    };
    loadClubs();
  }, []);

  // Load feed when club is selected
  useEffect(() => {
    if (selectedClub && myClubs.has(selectedClub.id)) {
      setCurrentPage(1); // Reset to first page when club changes
      loadFeed(1);
    } else {
      setPosts([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalPosts(0);
    }
  }, [selectedClub]);

  const loadFeed = async (page: number = currentPage) => {
    if (!selectedClub) return;
    try {
      setLoadingFeed(true);
      const feedData = await api.getClubFeed(selectedClub.slug, page, perPage);
      setPosts(feedData.feed);
      setCurrentPage(feedData.page);
      setTotalPages(feedData.pages);
      setTotalPosts(feedData.total);
    } catch (err) {
      // Error already toasted by api client
      setPosts([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalPosts(0);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadFeed(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadFeed(currentPage + 1);
    }
  };

  const filteredClubs = useMemo(() => {
    // First filter by membership status
    let filtered = clubs;
    if (clubFilter === 'joined') {
      filtered = clubs.filter((c) => myClubs.has(c.id));
    } else {
      filtered = clubs;
    }
    
    // Then filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    
    return filtered;
  }, [clubs, query, clubFilter, myClubs]);

  const handleJoinClub = async (club: Club) => {
    if (myClubs.has(club.id)) {
      // Already a member - backend doesn't have leave endpoint yet
      toast('You are already a member of this club', { icon: 'ℹ️' });
      return;
    }
    try {
      await api.joinClub(club.slug);
      setMyClubs(prev => new Set([...prev, club.id]));
      toast.success(`Joined ${club.name}!`);
      // If this is the selected club, load the feed
      if (selectedClub?.id === club.id) {
        loadFeed(1);
      }
    } catch (err) {
      // Error already toasted by api client
    }
  };

  const handlePostMessage = async () => {
    if (!selectedClub || !newPost.trim() || posting) return;
    try {
      setPosting(true);
      await api.createPost(selectedClub.slug, newPost.trim());
      setNewPost('');
      toast.success('Post created!');
      await loadFeed(1); // Reload first page after creating a post
    } catch (err) {
      // Error already toasted by api client
    } finally {
      setPosting(false);
    }
  };

  const handleAddComment = async (postId: number) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText || postingComments.has(postId)) return;
    try {
      setPostingComments(prev => new Set([...prev, postId]));
      await api.addComment(postId, commentText);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      toast.success('Comment added!');
      await loadFeed(currentPage); // Reload current page after adding comment
    } catch (err) {
      // Error already toasted by api client
    } finally {
      setPostingComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleCreateClub = async () => {
    if (!newClubName.trim() || creatingClub) return;
    try {
      setCreatingClub(true);
      const newClub = await api.createClub(newClubName.trim(), newClubDescription.trim() || undefined);
      setClubs(prev => [...prev, newClub]);
      setMyClubs(prev => new Set([...prev, newClub.id]));
      setShowCreateClub(false);
      setNewClubName('');
      setNewClubDescription('');
      toast.success(`Created ${newClub.name}!`);
      setSelectedClub(newClub);
    } catch (err) {
      // Error already toasted by api client
    } finally {
      setCreatingClub(false);
    }
  };

  const isMember = (clubId: number) => myClubs.has(clubId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main feed area */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">{selectedClub?.name ?? 'Select a Club'}</h2>
            {selectedClub && (
              <div>
                {selectedClub.description && (
                  <p className="text-sm text-gray-600 italic">{selectedClub.description}</p>
                )}
                {!isMember(selectedClub.id) && (
                  <p className="text-sm text-amber-600 mt-1">Join this club to view and post messages</p>
                )}
              </div>
            )}
          </div>
          {selectedClub && (
            <Button
              size="sm"
              onClick={() => handleJoinClub(selectedClub)}
              variant={isMember(selectedClub.id) ? 'outline' : 'default'}
              className={isMember(selectedClub.id) ? 'border-purple-300 text-purple-600' : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'}
              disabled={isMember(selectedClub.id)}
            >
              {isMember(selectedClub.id) ? 'Joined' : 'Join'}
            </Button>
          )}
        </div>

        <Card className="p-6 flex flex-col gap-2 bg-linear-to-br from-white via-blue-50/30 to-purple-50/30 border-purple-100">
          {loadingFeed ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading feed...</p>
            </div>
          ) : !selectedClub ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a club to view posts</p>
            </div>
          ) : !isMember(selectedClub.id) ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Join this club to view and post messages</p>
            </div>
          ) : (
            <>
              {/* Add Post Form */}
              <div className="mb-6 pb-6 border-b-2 border-gradient-to-r from-blue-200 to-purple-200">
                <Textarea
                  placeholder={`Write to ${selectedClub.name}...`}
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  disabled={posting}
                />
                <div className="flex justify-end mt-3">
                  <Button 
                    onClick={handlePostMessage} 
                    disabled={!newPost.trim() || posting}
                    className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>

              {/* Posts Section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Posts</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadFeed(currentPage)}
                    disabled={loadingFeed}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingFeed ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-4">
                  {posts.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No posts yet — be the first to post!</div>
                  )}
                  {posts.map((post) => (
                    <div key={post.id} className="border border-purple-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{post.author}</span>
                        <span className="text-xs text-gray-400">{formatLocalTime(post.created_at)}</span>
                      </div>
                      <div className="text-sm text-gray-700 mb-3">{post.body}</div>
                      
                      {/* Comments section */}
                      {post.comments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-purple-100">
                          <div className="space-y-2 mb-3">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="pl-3 border-l-2 border-purple-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-xs">{comment.author}</span>
                                  <span className="text-xs text-gray-400">{formatLocalTime(comment.created_at)}</span>
                                </div>
                                <div className="text-xs text-gray-600">{comment.body}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add comment input */}
                      <div className="mt-3 pt-3 border-t border-purple-100">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="flex-1 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim() || postingComments.has(post.id)}
                            className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            {postingComments.has(post.id) ? '...' : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination controls */}
                {totalPages > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-200">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1 || loadingFeed}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} {totalPosts > 0 && `(${totalPosts} total posts)`}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || loadingFeed}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Right sidebar: search + clubs list */}
      <aside className="lg:col-span-1">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Search clubs" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              className="bg-gray-50 border-gray-300 flex-1"
            />
            <Button
              onClick={() => setShowCreateClub(true)}
              size="sm"
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Card className="p-6 bg-linear-to-br from-white via-indigo-50/30 to-blue-50/30 border-indigo-100">
            <div className="mb-4">
              <Select value={clubFilter} onValueChange={(value: 'joined' | 'available') => setClubFilter(value)}>
                <SelectTrigger className="w-full text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 font-semibold border-purple-200">
                  <SelectValue placeholder="All Clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">All Clubs</SelectItem>
                  <SelectItem value="joined">Joined Clubs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Loading clubs...</p>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No clubs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClubs.map((c) => (
                  <div 
                    key={c.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer shadow-md ${
                      selectedClub?.id === c.id 
                        ? 'from-purple-100 to-pink-100 border-purple-200 shadow-md' 
                        : 'border-purple-100 bg-linear-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-200'
                    } bg-linear-to-r`}
                    onClick={() => setSelectedClub(c)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-purple-700">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-purple-600 mt-1 line-clamp-1">{c.description}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinClub(c);
                      }}
                      variant={isMember(c.id) ? 'outline' : 'default'}
                      className={isMember(c.id) ? 'border-purple-300 text-purple-600 ml-3 shrink-0' : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ml-3 shrink-0'}
                      disabled={isMember(c.id)}
                    >
                      {isMember(c.id) ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </aside>

      {/* Create Club Dialog */}
      <Dialog open={showCreateClub} onOpenChange={setShowCreateClub}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="club-name">Club Name *</Label>
              <Input
                id="club-name"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Enter club name"
                className="mt-1"
                disabled={creatingClub}
              />
            </div>
            <div>
              <Label htmlFor="club-description">Description</Label>
              <Textarea
                id="club-description"
                value={newClubDescription}
                onChange={(e) => setNewClubDescription(e.target.value)}
                placeholder="Enter club description (optional)"
                className="mt-1"
                disabled={creatingClub}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateClub(false);
                setNewClubName('');
                setNewClubDescription('');
              }}
              className="flex-1"
              disabled={creatingClub}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateClub}
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={!newClubName.trim() || creatingClub}
            >
              {creatingClub ? 'Creating...' : 'Create Club'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}