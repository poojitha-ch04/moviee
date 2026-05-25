import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import { User, Bookmark, Star } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('watchlist');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wlRes, recRes] = await Promise.all([
          api.get('/watchlist'),
          api.get('/recommendations'),
        ]);
        setWatchlist(wlRes.data);
        setRecommendations(recRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { id: 'watchlist', label: 'My Watchlist', icon: <Bookmark size={16} />, data: watchlist },
    { id: 'recommendations', label: 'For You', icon: <Star size={16} />, data: recommendations },
  ];

  const currentData = tabs.find(t => t.id === activeTab)?.data || [];

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <div className="pt-28 px-8 md:px-16">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/10">
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl font-black">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user?.username}</h1>
            <p className="text-gray-400 mt-1">{user?.email}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-gray-400"><span className="text-white font-bold">{watchlist.length}</span> in Watchlist</span>
              <span className="text-gray-400"><span className="text-white font-bold">{recommendations.length}</span> Recommendations</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'}`}>
                {tab.data.length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => <div key={i} className="h-[270px] skeleton rounded-xl" />)}
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={60} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No recommendations yet'}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {activeTab === 'watchlist'
                ? 'Browse movies and click + to add them here'
                : 'Rate some movies to get personalized recommendations'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 pb-16">
            {currentData.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
