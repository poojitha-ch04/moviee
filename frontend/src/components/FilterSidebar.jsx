import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const FilterSidebar = ({ onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [decade, setDecade] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [maxRuntime, setMaxRuntime] = useState('');

  const handleApply = () => {
    onApplyFilters({ 
      decade, 
      sort_by: sortBy,
      min_rating: minRating,
      min_year: minYear,
      max_year: maxYear,
      max_runtime: maxRuntime
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setDecade('');
    setSortBy('');
    setMinRating('');
    setMinYear('');
    setMaxYear('');
    setMaxRuntime('');
    onApplyFilters({ decade: '', sort_by: '', min_rating: '', min_year: '', max_year: '', max_runtime: '' });
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition text-sm border border-white/10"
      >
        <SlidersHorizontal size={16} /> Filters
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-[#141414] border-l border-white/10 z-[210] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-red-600" />
              Advanced Filters
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            
            {/* Rating Filter */}
            <div>
              <label className="flex justify-between text-sm font-semibold text-gray-300 mb-3">
                <span>Min Rating</span>
                <span className="text-yellow-400">{minRating ? `★ ${minRating}` : 'Any'}</span>
              </label>
              <input 
                type="range" 
                min="0" max="10" step="0.5"
                value={minRating || 0}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full accent-red-600"
              />
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Release Year</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
                <span className="text-gray-500">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Runtime Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Max Runtime</label>
              <select 
                value={maxRuntime} 
                onChange={(e) => setMaxRuntime(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Any Length</option>
                <option value="90">Under 90 mins</option>
                <option value="120">Under 2 hours</option>
                <option value="150">Under 2.5 hours</option>
                <option value="180">Under 3 hours</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Relevance / Default</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-white/10 flex gap-3">
            <button 
              onClick={handleClear}
              className="flex-1 px-4 py-3 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/10 transition text-sm"
            >
              Clear All
            </button>
            <button 
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transition shadow-[0_0_15px_rgba(220,38,38,0.3)] text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
