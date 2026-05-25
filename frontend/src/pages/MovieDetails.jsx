import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Plus, Check, Play, ArrowLeft, Bookmark, Sparkles } from 'lucide-react';
import { getColor } from 'colorthief';
import Navbar from '../components/Navbar';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import api from '../services/api';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isWatchParty, setIsWatchParty] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'green' });
  const [dominantColor, setDominantColor] = useState('#141414');
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieRes, similarRes, watchlistRes, reviewsRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/movies/${id}/similar`),
          api.get('/watchlist').catch(() => ({ data: [] })),
          api.get(`/ratings/${id}/reviews`).catch(() => ({ data: [] })),
        ]);
        setMovie(movieRes.data);
        setSimilar(similarRes.data);
        setReviews(reviewsRes.data);
        const isInList = watchlistRes.data.some(m => m.id === parseInt(id));
        setInWatchlist(isInList);
        
        // Fetch AI insights independently
        setInsightsLoading(true);
        api.get(`/movies/${id}/insights`).then(res => {
          setInsights(res.data);
          setInsightsLoading(false);
        }).catch(err => {
          console.error(err);
          setInsightsLoading(false);
        });
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (movie?.poster_url) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = movie.poster_url;
      img.onload = async () => {
        try {
          const color = await getColor(img);
          // Darken the color slightly for better contrast
          setDominantColor(`rgb(${Math.floor(color[0]*0.6)}, ${Math.floor(color[1]*0.6)}, ${Math.floor(color[2]*0.6)})`);
        } catch (e) {
          console.error('ColorThief error:', e);
        }
      };
    }
  }, [movie]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'green' }), 3000);
  };

  const handleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie.id}`);
        setInWatchlist(false);
        showToast('Removed from watchlist');
      } else {
        await api.post('/watchlist', { movie_id: movie.id });
        setInWatchlist(true);
        showToast('Added to watchlist!');
      }
    } catch (err) {
      showToast('Error updating watchlist', 'red');
    }
  };

  const handleRating = async (rating) => {
    setUserRating(rating);
    try {
      await api.post('/ratings', { movie_id: movie.id, rating, review_text: reviewText || null });
      showToast(`Rated ${rating} ★ — recommendations updated!`);
      // Refresh reviews if there was text
      if (reviewText) {
        const res = await api.get(`/ratings/${movie.id}/reviews`);
        setReviews(res.data);
        setReviewText('');
      }
    } catch {
      showToast('Error saving rating', 'red');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="text-red-600 text-4xl font-black animate-pulse">MOVIEE</div>
    </div>
  );

  if (!movie) return null;

  return (
    <div className="min-h-screen text-white transition-colors duration-1000 ease-in-out" style={{ backgroundColor: '#141414', backgroundImage: `radial-gradient(circle at top, ${dominantColor} 0%, #141414 70%)` }}>
      <Navbar />

      {/* Trailer Modal */}
      {showTrailer && (
        <TrailerModal
          movieId={movie.id}
          movieTitle={movie.title}
          isWatchParty={isWatchParty}
          onClose={() => {
            setShowTrailer(false);
            setIsWatchParty(false);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast.msg && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'red' ? 'bg-red-700' : 'bg-green-700'
        } text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Backdrop */}
      <div className="relative h-[65vh] w-full">
        <img
          src={movie.backdrop_url || movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = movie.poster_url; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #141414, transparent 50%), linear-gradient(to right, #141414, transparent 80%)` }} />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-8 flex items-center gap-2 text-white/70 hover:text-white transition bg-black/40 hover:bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Movie Details */}
      <div className="px-6 md:px-16 -mt-20 md:-mt-56 relative z-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Poster */}
        <div className="hidden md:block flex-shrink-0">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-52 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-shadow duration-1000"
            style={{ boxShadow: `0 20px 50px ${dominantColor}` }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 pt-16 md:pt-0">
          <h1 className="text-4xl md:text-6xl font-black mb-2 leading-tight">{movie.title}</h1>
          {movie.tagline && (
            <p className="text-gray-400 italic text-lg mb-4">"{movie.tagline}"</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
            <span className="flex items-center gap-1 text-yellow-400 font-bold text-base">
              <Star size={16} fill="currentColor" /> {movie.vote_average?.toFixed(1)}/10
            </span>
            <span className="text-gray-400">{movie.release_year}</span>
            <span className="border border-gray-600 text-gray-300 px-2 py-0.5 rounded text-xs">HD</span>
            {movie.genre?.split(',').map(g => (
              <span key={g} className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-xs border border-white/10">
                {g.trim()}
              </span>
            ))}
          </div>

          <p className="text-gray-300 text-base leading-relaxed mb-8 max-w-2xl">{movie.description}</p>

          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl p-6 mb-8 max-w-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600" />
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-400" size={20} /> AI Insights
            </h3>
            
            {insightsLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ) : insights ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Why Watch This?</p>
                  <p className="text-gray-200 text-sm italic border-l-2 border-purple-500 pl-3">{insights.why_watch}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Trivia</p>
                  <ul className="space-y-2">
                    {insights.trivia.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-purple-400 mt-0.5">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Failed to generate insights.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            {/* PLAY BUTTON — opens YouTube trailer */}
            <button
              onClick={() => {
                setIsWatchParty(false);
                setShowTrailer(true);
              }}
              className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 active:scale-95 transition text-sm"
            >
              <Play size={18} fill="black" /> Play Trailer
            </button>
            
            {/* WATCH PARTY BUTTON */}
            <button
              onClick={() => {
                setIsWatchParty(true);
                setShowTrailer(true);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 active:scale-95 transition text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              <Play size={18} fill="white" /> Host Watch Party
            </button>

            {/* WATCHLIST BUTTON */}
            <button
              onClick={handleWatchlist}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition border text-sm ${
                inWatchlist
                  ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                  : 'bg-transparent border-white/30 text-white hover:border-white hover:bg-white/10'
              }`}
            >
              {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          </div>

          {/* Star Rating & Review */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 inline-block w-full max-w-lg">
            <p className="text-gray-400 text-sm mb-3 font-medium">Rate and Review</p>
            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white mb-3 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Write a review... (optional)"
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-125 active:scale-110"
                  >
                    <Star
                      size={26}
                      className={`transition-colors ${
                        star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <span className="text-yellow-400 font-bold text-sm bg-yellow-400/10 px-3 py-1 rounded-full">{userRating}/5 Rated</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="px-8 md:px-16 mt-20 relative z-10 max-w-5xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-red-600 rounded-full" />
          User Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm">
                      {r.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.username}</p>
                      <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded text-yellow-400 text-xs font-bold">
                    <Star size={12} fill="currentColor" /> {r.rating}
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic">"{r.review_text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar Movies */}
      {similar.length > 0 && (
        <div className="px-8 md:px-16 mt-14 pb-20">
          <MovieRow title="More Like This" movies={similar} />
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
