import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen } from 'lucide-react';
import { api } from '../api/client';

interface BookSurvey {
  genre: string;
  length: string;
  series: string;
  similarBooks: string;
  mood: string;
}

export function Recommendation() {
  const [survey, setSurvey] = useState<BookSurvey>({
    genre: '',
    length: '',
    series: '',
    similarBooks: '',
    mood: ''
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSurveyChange = (field: keyof BookSurvey, value: string) => {
    setSurvey(prev => ({ ...prev, [field]: value }));
  };

  const getRecommendations = async () => {
    setIsLoading(true);
    console.log(survey, "survey data");

    try {
      const data = await api.getRecommendations(survey);
      console.log(data, "recommendation data");
      setRecommendations(data.recommendations);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Find The Perfect Book</h1>
        </div>
        <p className="text-gray-600">Tell us what you're looking for and we'll find the perfect next book for you!</p>
      </div>

      <Card className="p-6">
        <div className="grid gap-6">
          <div>
            <Label htmlFor="genre">What genre are you interested in?</Label>
            <Select value={survey.genre} onValueChange={(value) => handleSurveyChange('genre', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="mystery">Mystery/Thriller</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="sci-fi">Science Fiction</SelectItem>
                <SelectItem value="biography">Biography</SelectItem>
                <SelectItem value="self-help">Self Help</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="comedy">comedy</SelectItem>
                <SelectItem value="comic">comic</SelectItem>
                <SelectItem value="cooking">cooking</SelectItem>
                <SelectItem value="non-fiction">non-fiction</SelectItem>
                <SelectItem value="any">Any Genre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="length">How long should the book be?</Label>
            <Select value={survey.length} onValueChange={(value) => handleSurveyChange('length', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select book length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiny">Tiny (under 100 pages)</SelectItem>
                <SelectItem value="short">Short (under 200 pages)</SelectItem>
                <SelectItem value="medium">Medium (200-400 pages)</SelectItem>
                <SelectItem value="long">Long (400-800 pages)</SelectItem>
                <SelectItem value="bible-long">Bible Long (800+ pages)</SelectItem>
                <SelectItem value="any">Any length</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="series">Do you want a standalone book or series?</Label>
            <Select value={survey.series} onValueChange={(value) => handleSurveyChange('series', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Standalone book</SelectItem>
                <SelectItem value="series">Part of a series</SelectItem>
                <SelectItem value="either">Either is fine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="similar">What are some books you've enjoyed recently? (optional)</Label>
            <Input
              id="similar"
              placeholder="e.g., Harry Potter, Project Hail Mary..."
              value={survey.similarBooks}
              onChange={(e) => handleSurveyChange('similarBooks', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="mood">What mood are you looking for?</Label>
            <Select value={survey.mood} onValueChange={(value) => handleSurveyChange('mood', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light and fun</SelectItem>
                <SelectItem value="intense">Intense and gripping</SelectItem>
                <SelectItem value="thoughtful">Thoughtful and deep</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="escapist">Escapist adventure</SelectItem>
                <SelectItem value="educational">Educational/learning</SelectItem>
                <SelectItem value="emotional">Emotional journey</SelectItem>
                <SelectItem value="any">Surprise me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={getRecommendations}
            disabled={!survey.genre || !survey.length || !survey.series || !survey.mood || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Getting Recommendations...
              </>
            ) : (
              <>
                Search!
              </>
            )}
          </Button>
        </div>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Recommendations
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
            {recommendations.map((book, index) => (
              <Card key={index} className="p-4">
                <h4 className="text-md font-bold mb-2">{book.title}</h4>
                <p className="text-sm text-gray-600 mb-1">by {book.author}</p>
                <p className="text-sm">{book.description}</p>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}