import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: direction === 'left' ? -600 : 600, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-3 px-2">{title}</h2>
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-lg"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        {/* Movie Cards Row */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-scroll no-scrollbar px-2 pb-2"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-lg"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>
    </section>
  );
};

export default MovieRow;
