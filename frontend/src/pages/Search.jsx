import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import api from '../services/api';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState(query);
  const [loading, setLoading] = useState(false);
  const [isSmartSearch, setIsSmartSearch] = useState(false);

  useEffect(() => {
    setInputValue(query);
    if (query) {
      setLoading(true);
      const endpoint = isSmartSearch ? '/movies/search/smart' : '/movies/search';
      api.get(`${endpoint}?q=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [query, isSmartSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <div className="pt-28 px-8 md:px-16">
        {/* Search Bar */}
        <div className="max-w-2xl mb-10">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isSmartSearch ? "Describe a movie (e.g. scary movies in the woods)..." : "Search for movies, genres..."}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm transition"
              />
            </div>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition">
              Search
            </button>
          </form>

          {/* AI Toggle */}
          <div className="flex items-center gap-3 ml-2">
            <button 
              onClick={() => setIsSmartSearch(!isSmartSearch)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${isSmartSearch ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              <Sparkles size={16} /> 
              {isSmartSearch ? 'AI Smart Search ON' : 'Use AI Smart Search'}
            </button>
            <span className="text-xs text-gray-500">
              {isSmartSearch ? 'Describe a plot, mood, or vibe.' : 'Find exact matches.'}
            </span>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="h-[270px] skeleton rounded-xl" />
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-20">
            <SearchIcon size={60} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No results found for "<span className="text-white">{query}</span>"</p>
            <p className="text-gray-600 text-sm mt-2">Try a different search term or browse by genre</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-6">
              Found <span className="text-white font-semibold">{results.length}</span> results for "
              <span className="text-white">{query}</span>"
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {results.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </>
        )}

        {!query && (
          <div className="text-center py-20">
            <SearchIcon size={60} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Search for your favorite movies</p>
            <p className="text-gray-600 text-sm mt-2">Try genres like Action, Drama, Comedy... or turn on AI Search and describe the plot!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
