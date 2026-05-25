import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown, LogOut, User, Bookmark } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-all duration-300">
      {/* Left side */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-black text-red-600 tracking-widest hover:text-red-500 transition">
          MOVIEE
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/" className="text-gray-200 hover:text-white transition">Home</Link>
          <Link to="/search?q=Action" className="text-gray-200 hover:text-white transition">Action</Link>
          <Link to="/search?q=Comedy" className="text-gray-200 hover:text-white transition">Comedy</Link>
          <Link to="/search?q=Drama" className="text-gray-200 hover:text-white transition">Drama</Link>
          <Link to="/search?q=Sci-Fi" className="text-gray-200 hover:text-white transition">Sci-Fi</Link>
          <Link to="/feed" className="text-gray-200 hover:text-white transition font-bold text-red-500">Social Feed</Link>
          <Link to="/profile" className="text-gray-200 hover:text-white transition">My List</Link>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center">
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
                placeholder="Search movies..."
                className="bg-black/80 border border-white/40 text-white px-4 py-2 text-sm rounded-lg focus:outline-none focus:border-white w-52 transition-all"
                autoFocus
              />
            </form>
          ) : (
            <button onClick={() => setShowSearch(true)} className="text-gray-300 hover:text-white transition">
              <Search size={20} />
            </button>
          )}
        </div>

        <Bell size={20} className="text-gray-300 hover:text-white cursor-pointer transition" />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown size={14} className={`text-white transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-12 bg-black/95 border border-white/10 rounded-xl shadow-2xl w-48 py-2 z-50">
              <div className="px-4 py-2 border-b border-white/10 mb-1">
                <p className="text-white font-semibold text-sm">{user?.username}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition text-sm"
              >
                <User size={14} /> Profile
              </Link>
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition text-sm"
              >
                <Bookmark size={14} /> My Watchlist
              </Link>
              <hr className="border-white/10 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-white/10 transition text-sm w-full text-left"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
