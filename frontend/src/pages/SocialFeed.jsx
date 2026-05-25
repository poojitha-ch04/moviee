import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Users, Globe, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SocialFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [feedType, setFeedType] = useState('global');
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/me/feed?feed_type=${feedType}`);
      setFeed(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [feedType]);

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await api.post(`/users/${userId}/unfollow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }
      // Re-fetch feed to update UI (lazy way)
      fetchFeed();
    } catch (err) {
      console.error("Error toggling follow", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <div className="pt-28 px-8 md:px-16 max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
          <MessageSquare className="text-red-600" size={32} /> Social Feed
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFeedType('global')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
              feedType === 'global' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Globe size={18} /> Global Feed
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
              feedType === 'following' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Users size={18} /> Following
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <Users size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-xl font-bold text-gray-300">Nothing here yet!</p>
            <p className="text-gray-500 mt-2">
              {feedType === 'following' 
                ? "You aren't following anyone with recent activity."
                : "No recent activity on the platform."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map(item => (
              <div key={item.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                      {item.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {item.username}
                        {item.user_id !== user?.id && (
                          <button
                            onClick={() => handleFollowToggle(item.user_id, false)}
                            className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-red-600 hover:text-white transition text-gray-300"
                          >
                            Follow
                          </button>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Rated</p>
                    <div className="flex items-center gap-1 text-yellow-400 font-black text-xl">
                      ★ {item.rating}
                    </div>
                  </div>
                </div>

                <div className="ml-16">
                  <h4 
                    onClick={() => navigate(`/movie/${item.movie_id}`)}
                    className="text-xl font-bold mb-2 cursor-pointer hover:text-red-500 transition inline-block"
                  >
                    {item.movie_title}
                  </h4>
                  {item.review && (
                    <div className="bg-black/40 p-4 rounded-lg text-gray-300 text-sm italic border-l-2 border-red-600">
                      "{item.review}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;
