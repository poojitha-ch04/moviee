import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';

const MovieCard = ({ movie }) => {
  const [added, setAdded] = useState(false);

  const handleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post('/watchlist', { movie_id: movie.id });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Watchlist error', err);
    }
  };

  return (
    <Link to={`/movie/${movie.id}`} className="block">
      <motion.div
        className="relative min-w-[180px] w-[180px] h-[270px] rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
        whileHover={{ scale: 1.06, zIndex: 20 }}
        transition={{ duration: 0.25 }}
      >
        {/* Poster */}
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.src = `https://via.placeholder.com/180x270/1a1a1a/666?text=${encodeURIComponent(movie.title)}`; }}
        />

        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-black/70 rounded-md px-2 py-1 flex items-center gap-1">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-bold">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{movie.title}</h3>
          <p className="text-gray-300 text-xs mb-2">{movie.release_year} • {movie.genre?.split(',')[0]}</p>
          <button
            onClick={handleWatchlist}
            className={`flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md transition ${
              added ? 'bg-green-600 text-white' : 'bg-white/20 hover:bg-red-600 text-white'
            }`}
          >
            <Plus size={12} /> {added ? 'Added!' : 'My List'}
          </button>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;
