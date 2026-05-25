import { useEffect, useState, useRef } from 'react';
import { X, Loader } from 'lucide-react';
import YouTube from 'react-youtube';
import api from '../services/api';
import WatchPartyChat from './WatchPartyChat';
import { useAuth } from '../context/AuthContext';

const TrailerModal = ({ movieId, movieTitle, isWatchParty = false, onClose }) => {
  const { user } = useAuth();
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [ws, setWs] = useState(null);
  const playerRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/movies/${movieId}/trailer`);
        setTrailerKey(res.data.key);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();

    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [movieId]);

  // WebSocket Setup for Watch Party
  useEffect(() => {
    if (!isWatchParty) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/api/v1/watch-party/ws/${movieId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'chat',
        user: 'System',
        message: `${user?.username || 'A user'} joined the party!`
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!playerRef.current) return;
        const player = playerRef.current.getInternalPlayer();

        if (data.type === 'sync') {
          // Prevent infinite loop if we triggered it
          if (data.sender === user?.username) return;

          isSyncingRef.current = true;
          
          if (data.action === 'play') {
            player.seekTo(data.time, true);
            player.playVideo();
          } else if (data.action === 'pause') {
            player.seekTo(data.time, true);
            player.pauseVideo();
          }
          
          // Release sync lock after a delay
          setTimeout(() => { isSyncingRef.current = false; }, 1000);
        }
      } catch (e) {
        // Ignore parsing errors, Chat handles its own parsing
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [isWatchParty, movieId, user]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const broadcastSync = async (action) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || isSyncingRef.current || !playerRef.current) return;
    
    const player = playerRef.current.getInternalPlayer();
    const time = await player.getCurrentTime();
    
    ws.send(JSON.stringify({
      type: 'sync',
      action,
      time,
      sender: user?.username
    }));
  };

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlay = () => broadcastSync('play');
  const onPause = () => broadcastSync('pause');

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
      color: 'red'
    },
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`relative flex flex-col md:flex-row w-full ${isWatchParty ? 'max-w-7xl h-[90vh] md:h-[80vh]' : 'max-w-5xl'} rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black`}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-950/60 to-black/80">
            <div>
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Now Playing</p>
              <h3 className="text-white font-black text-lg mt-0.5">{movieTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded-full"
              title="Close (Esc)"
            >
              <X size={22} />
            </button>
          </div>

          {/* Video Player */}
          <div className={`relative w-full bg-black ${isWatchParty ? 'flex-1' : ''}`} style={!isWatchParty ? { paddingBottom: '56.25%' } : {}}>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                </div>
                <p className="text-gray-300 font-semibold">Loading trailer...</p>
              </div>
            )}

            {!loading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f0f]">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-white font-semibold text-lg mb-2">Trailer not available</p>
              </div>
            )}

            {!loading && trailerKey && !error && (
              <div className="absolute inset-0 w-full h-full">
                <YouTube
                  videoId={trailerKey}
                  opts={opts}
                  onReady={onReady}
                  onPlay={onPlay}
                  onPause={onPause}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-black/80 flex items-center justify-between mt-auto border-t border-white/10">
            <p className="text-gray-500 text-xs">Playing inside Moviee • Powered by YouTube</p>
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white transition border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
            >
              Close Player
            </button>
          </div>
        </div>
        
        {/* Sidebar Watch Party Chat */}
        {isWatchParty && ws && (
          <WatchPartyChat ws={ws} user={user} />
        )}
      </div>
    </div>
  );
};

export default TrailerModal;
