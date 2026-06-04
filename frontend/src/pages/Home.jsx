import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import FilterSidebar from '../components/FilterSidebar';
import api from '../services/api';
import { Info, Play } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const SkeletonRow = () => (
  <div className="mb-10">
    <div className="h-6 w-48 skeleton rounded mb-3 mx-2" />
    <div className="flex gap-3 px-2 overflow-hidden">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="min-w-[180px] h-[270px] skeleton rounded-xl flex-shrink-0" />
      ))}
    </div>
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [action, setAction] = useState([]);
  const [comedy, setComedy] = useState([]);
  const [drama, setDrama] = useState([]);
  const [scifi, setScifi] = useState([]);
  const [telugu, setTelugu] = useState([]);
  const [hindi, setHindi] = useState([]);
  const [english, setEnglish] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [activeParties, setActiveParties] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [filters, setFilters] = useState({ decade: '', sort_by: '' });

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trendRes, topRes, actionRes, comedyRes, dramaRes, scifiRes, teRes, hiRes, enRes, partiesRes] = await Promise.all([
          api.get('/movies/trending'),
          api.get('/movies/top-rated'),
          api.get('/movies/by-genre/Action'),
          api.get('/movies/by-genre/Comedy'),
          api.get('/movies/by-genre/Drama'),
          api.get('/movies/by-genre/Sci-Fi'),
          api.get('/movies/by-language/te'),
          api.get('/movies/by-language/hi'),
          api.get('/movies/by-language/en'),
          api.get('/watch-party/active')
        ]);
        setTrending(trendRes.data);
        setTopRated(topRes.data);
        setAction(actionRes.data);
        setComedy(comedyRes.data);
        setDrama(dramaRes.data);
        setScifi(scifiRes.data);
        setTelugu(teRes.data);
        setHindi(hiRes.data);
        setEnglish(enRes.data);
        setActiveParties(partiesRes.data);
        if (trendRes.data.length > 0) setHero(trendRes.data[0]);

        try {
          const recRes = await api.get('/recommendations');
          setRecommendations(recRes.data);
        } catch {}
      } catch (err) {
        console.error('Error fetching movies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const fetchMore = async (reset = false, currentFilters = filters) => {
    try {
      const currentSkip = reset ? 0 : page * 20;
      let url = `/movies?skip=${currentSkip}&limit=20`;
      
      if (currentFilters.decade) url += `&decade=${currentFilters.decade}`;
      if (currentFilters.sort_by) url += `&sort_by=${currentFilters.sort_by}`;
      if (currentFilters.min_rating) url += `&min_rating=${currentFilters.min_rating}`;
      if (currentFilters.min_year) url += `&min_year=${currentFilters.min_year}`;
      if (currentFilters.max_year) url += `&max_year=${currentFilters.max_year}`;
      if (currentFilters.max_runtime) url += `&max_runtime=${currentFilters.max_runtime}`;

      const res = await api.get(url);
      
      if (reset) {
        setDiscover(res.data);
        setPage(1);
      } else {
        setDiscover(prev => [...prev, ...res.data]);
        setPage(p => p + 1);
      }
      
      if (res.data.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching more movies', err);
    }
  };

  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchMore();
    }
  }, [inView, hasMore, loading]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setHasMore(true);
    fetchMore(true, newFilters);
    
    // If filters are active, we might want to hide the hero or scroll down
    if (newFilters.decade || newFilters.sort_by || newFilters.min_rating || newFilters.min_year || newFilters.max_year || newFilters.max_runtime) {
      window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const hasActiveFilters = filters.decade || filters.sort_by || filters.min_rating || filters.min_year || filters.max_year || filters.max_runtime;

  return (
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">
      <Navbar />

      {/* Trailer Modal for Hero */}
      {showTrailer && hero && (
        <TrailerModal
          movieId={hero.id}
          movieTitle={hero.title}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* Hero Section */}
      {hero && (
        <div className="relative h-[85vh] w-full">
          <div className="absolute inset-0">
            <img
              src={hero.backdrop_url || hero.poster_url}
              alt={hero.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = hero.poster_url; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/20" />
          </div>

          <div className="absolute bottom-[20%] left-12 z-20 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
                #1 TRENDING
              </span>
              <span className="text-yellow-400 font-bold text-sm">★ {hero.vote_average?.toFixed(1)}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-none mb-3">{hero.title}</h1>
            <p className="text-gray-300 text-sm mb-1">{hero.genre} • {hero.release_year}</p>
            <p className="text-gray-300 text-sm mb-8 max-w-lg line-clamp-3 leading-relaxed">{hero.description}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 active:scale-95 transition"
              >
                <Play size={18} fill="black" /> Play Trailer
              </button>
              <button
                onClick={() => navigate(`/movie/${hero.id}`)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 active:scale-95 transition"
              >
                <Info size={18} /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Rows */}
      <div className="px-8 pb-24 -mt-32 relative z-20">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <>
            {!hasActiveFilters && recommendations.length > 0 && (
              <MovieRow title="✨ Recommended for You" movies={recommendations} />
            )}

            {!hasActiveFilters && activeParties.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full animate-pulse" />
                  Live Watch Parties
                  <span className="text-sm font-normal text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full ml-2">
                    {activeParties.length} Active
                  </span>
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {activeParties.map((party) => (
                    <div 
                      key={`party-${party.movie.id}`} 
                      onClick={() => navigate(`/movie/${party.movie.id}`)}
                      className="relative min-w-[200px] h-[300px] rounded-xl cursor-pointer group overflow-hidden border border-red-500/30"
                    >
                      <img 
                        src={party.movie.poster_url} 
                        alt={party.movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                      
                      <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        {party.viewers} {party.viewers === 1 ? 'Viewer' : 'Viewers'}
                      </div>
                      
                      <div className="absolute bottom-0 p-4 w-full">
                        <h4 className="font-bold text-white leading-tight mb-1">{party.movie.title}</h4>
                        <p className="text-red-400 text-xs font-semibold">Join Party Now</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!hasActiveFilters && <MovieRow title="🔥 Trending Now" movies={trending} />}
            {!hasActiveFilters && telugu.length > 0 && <MovieRow title="🎬 Tollywood Hits (Telugu)" movies={telugu} />}
            {!hasActiveFilters && hindi.length > 0 && <MovieRow title="✨ Bollywood Blockbusters (Hindi)" movies={hindi} />}
            {!hasActiveFilters && english.length > 0 && <MovieRow title="🌟 Hollywood Highlights (English)" movies={english} />}
            {!hasActiveFilters && <MovieRow title="⭐ Top Rated" movies={topRated} />}
            {!hasActiveFilters && <MovieRow title="💥 Action & Adventure" movies={action} />}
            {!hasActiveFilters && <MovieRow title="😂 Comedy" movies={comedy} />}
            {!hasActiveFilters && <MovieRow title="🎭 Drama" movies={drama} />}
            {!hasActiveFilters && <MovieRow title="🚀 Science Fiction" movies={scifi} />}
            
            {/* Infinite Scroll Discover / Filter Section */}
            {(discover.length > 0 || hasActiveFilters) && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                    {hasActiveFilters ? 'Filtered Results' : 'Discover More'}
                  </h2>
                  <FilterSidebar onApplyFilters={handleApplyFilters} />
                </div>
                
                {discover.length === 0 && hasActiveFilters ? (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No movies found matching these filters.</p>
                    <button onClick={() => handleApplyFilters({decade:'', sort_by:''})} className="mt-4 text-red-500 hover:underline">Clear Filters</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                  {discover.map(movie => (
                    <div 
                      key={`discover-${movie.id}`} 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-50"
                    >
                      <img 
                        src={movie.poster_url} 
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-md shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 rounded-md">
                        <h4 className="font-bold text-sm line-clamp-2">{movie.title}</h4>
                        <span className="text-yellow-400 text-xs">★ {movie.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}
            
            {hasMore && (
              <div ref={ref} className="w-full flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div>
              </div>
            )}
            
            {!hasMore && discover.length > 0 && (
              <p className="text-center text-gray-500 mt-10">You've reached the end of our catalog!</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
