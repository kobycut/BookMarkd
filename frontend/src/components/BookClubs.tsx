import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface Club {
  id: number;
  name: string;
  description?: string;
  members: number;
}

interface Message {
  id: number;
  user: string;
  text: string;
  created_at: string;
}

const MOCK_CLUBS: Club[] = [
  { id: 1, name: 'Classics Lovers', description: 'Discuss classic literature', members: 124 },
  { id: 2, name: 'Sci-Fi Fans', description: 'Speculative futures & space opera', members: 210 },
  { id: 3, name: 'Modern Fiction', description: 'Contemporary novels and translations', members: 84 },
  { id: 4, name: 'Nonfiction Picks', description: 'History, science and memoirs', members: 66 },
  { id: 5, name: 'YA Book Club', description: 'Young adult conversation and recs', members: 153 },
];

const MOCK_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, user: 'Alice', text: "Just finished 'Pride and Prejudice' — let's discuss the ending!", created_at: '2025-11-01T12:34:00Z' },
    { id: 2, user: 'Bob', text: "I've started 'Emma' — so many interesting social cues.", created_at: '2025-11-02T08:12:00Z' },
  ],
  2: [
    { id: 1, user: 'Dana', text: "Anyone read the new space-opera? Great world-building.", created_at: '2025-11-10T16:00:00Z' },
  ],
  3: [
    { id: 1, user: 'Sam', text: "Recommendation: 'The Night Watchman' — beautiful prose.", created_at: '2025-10-28T09:00:00Z' },
  ],
};

export function BookClubs() {
  const [clubs] = useState<Club[]>(MOCK_CLUBS);
  const [query, setQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(MOCK_CLUBS[0] ?? null);
  const [joined, setJoined] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<Message[]>(() => MOCK_MESSAGES[MOCK_CLUBS[0]?.id ?? 0] ?? []);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (selectedClub) {
      setMessages(MOCK_MESSAGES[selectedClub.id] ?? []);
    } else {
      setMessages([]);
    }
  }, [selectedClub]);

  const filteredClubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((c) => c.name.toLowerCase().includes(q));
  }, [clubs, query]);

  const handleJoinToggle = (club: Club) => {
    setJoined((s) => ({ ...s, [club.id]: !s[club.id] }));
  };

  const handlePostMessage = () => {
    if (!selectedClub || !newMessage.trim()) return;
    const msg: Message = {
      id: Date.now(),
      user: 'You',
      text: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, msg]);
    setNewMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main feed area */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">{selectedClub?.name ?? 'Select a Club'}</h2>
            {selectedClub && (
              <div>
                <p className="text-sm text-gray-600 italic">{selectedClub.description}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedClub.members} members in this club</p>
              </div>
            )}
          </div>
          {selectedClub && (
            <Button
              size="sm"
              onClick={() => handleJoinToggle(selectedClub)}
              variant={joined[selectedClub.id] ? 'outline' : 'default'}
              className={joined[selectedClub.id] ? 'border-purple-300 text-purple-600' : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'}
            >
              {joined[selectedClub.id] ? 'Leave' : 'Join'}
            </Button>
          )}
        </div>

        <Card className="p-6 flex flex-col bg-linear-to-br from-white via-blue-50/30 to-purple-50/30 border-purple-100">
          <div className="flex-1 border-b-2 border-gradient-to-r from-blue-200 to-purple-200 pb-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Messages</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">No messages yet — be the first to post!</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="border border-purple-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{m.user}</span>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-700">{m.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <textarea
              placeholder={selectedClub ? `Write to ${selectedClub.name}...` : 'Select a club to post'}
              className="w-full border border-gray-300 rounded-lg p-3 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedClub}
            />
            <div className="flex justify-end mt-3">
              <Button 
                onClick={handlePostMessage} 
                disabled={!newMessage.trim() || !selectedClub}
                className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                Post
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right sidebar: search + clubs list */}
      <aside className="lg:col-span-1">
        <div className="space-y-4">
          <Input 
            placeholder="Search clubs" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="bg-gray-50 border-gray-300"
          />

          <Card className="p-6 bg-linear-to-br from-white via-indigo-50/30 to-blue-50/30 border-indigo-100">
            <h4 className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 font-semibold mb-2">Available Clubs</h4>
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
                    <div className="text-xs text-purple-600 mt-1 font-medium">{c.members} members</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinToggle(c);
                    }}
                    variant={joined[c.id] ? 'outline' : 'default'}
                    className={joined[c.id] ? 'border-purple-300 text-purple-600 ml-3 shrink-0' : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ml-3 shrink-0'}
                  >
                    {joined[c.id] ? 'Leave' : 'Join'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
}