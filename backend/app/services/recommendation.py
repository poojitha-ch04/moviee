import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.db.database import SessionLocal
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.watchlist import Watchlist

def get_recommendations(user_id: int, top_n: int = 10):
    db = SessionLocal()
    
    movies = db.query(Movie).all()
    ratings = db.query(Rating).all()
    watchlists = db.query(Watchlist).all()
    
    if not movies:
        db.close()
        return []

    movies_data = [{"id": m.id, "title": m.title, "genre": m.genre, "description": m.description} for m in movies]
    
    # Combine explicit ratings and implicit ratings (watchlist)
    ratings_data = [{"user_id": r.user_id, "movie_id": r.movie_id, "rating": r.rating} for r in ratings]
    for w in watchlists:
        # Treat watchlist addition as a solid 4.0 implicit rating if they haven't explicitly rated it
        if not any(r['user_id'] == w.user_id and r['movie_id'] == w.movie_id for r in ratings_data):
            ratings_data.append({"user_id": w.user_id, "movie_id": w.movie_id, "rating": 4.0})
    
    if not ratings_data:
        # Fallback to popular if no ratings or watchlists exist globally
        popular_movies = sorted(movies, key=lambda x: x.vote_average or 0, reverse=True)[:top_n]
        db.close()
        return popular_movies
    
    df_movies = pd.DataFrame(movies_data)
    df_ratings = pd.DataFrame(ratings_data)
    
    df_movies['content'] = df_movies['genre'] + " " + df_movies['description']
    
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df_movies['content'])
    content_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    user_movie_matrix = df_ratings.pivot_table(index='user_id', columns='movie_id', values='rating').fillna(0)
    
    user_sim = cosine_similarity(user_movie_matrix)
    user_sim_df = pd.DataFrame(user_sim, index=user_movie_matrix.index, columns=user_movie_matrix.index)
    
    user_ratings = df_ratings[df_ratings['user_id'] == user_id]
    
    if user_ratings.empty:
        popular = df_ratings.groupby('movie_id')['rating'].mean().sort_values(ascending=False).head(top_n)
        popular_movies = [db.query(Movie).get(int(m_id)) for m_id in popular.index]
        db.close()
        return [m for m in popular_movies if m is not None]
    
    if user_id in user_sim_df.index:
        similar_users = user_sim_df[user_id].sort_values(ascending=False).index[1:6]
        similar_users_ratings = df_ratings[df_ratings['user_id'].isin(similar_users)]
        collab_recs = similar_users_ratings.groupby('movie_id')['rating'].mean().sort_values(ascending=False)
        collab_movies = list(collab_recs.index)
    else:
        collab_movies = []

    top_movie_id = user_ratings.sort_values(by='rating', ascending=False).iloc[0]['movie_id']
    movie_idx = df_movies[df_movies['id'] == top_movie_id].index[0]
    
    sim_scores = list(enumerate(content_sim[movie_idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    content_movies = [df_movies.iloc[i[0]]['id'] for i in sim_scores[1:11]]
    
    hybrid_movies_ids = list(set(collab_movies[:10] + content_movies))[:top_n]
    
    recommended = [db.query(Movie).get(int(m_id)) for m_id in hybrid_movies_ids]
    
    db.close()
    return [m for m in recommended if m is not None]
