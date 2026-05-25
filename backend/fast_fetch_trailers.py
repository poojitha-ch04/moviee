import sqlite3
import json
import os
from youtubesearchpython import VideosSearch

DB_PATH = "moviee.db"
JSON_PATH = "trailer_links.json"

def fetch_trailers():
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            links = json.load(f)
    else:
        links = {}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM movies")
    movies = cursor.fetchall()
    
    print(f"Starting FAST YouTube scraping for {len(movies)} movies...")
    
    for movie_id, title in movies:
        str_id = str(movie_id)
        # Skip if already uniquely mapped (ignore if mapped to fallback)
        if str_id in links and links[str_id] != "Ywyei5orJ2M":
            continue
            
        try:
            search = VideosSearch(f"{title} official trailer", limit=1)
            result = search.result()
            
            if result and result.get("result") and len(result["result"]) > 0:
                video_id = result["result"][0]["id"]
                links[str_id] = video_id
                print(f"[{title}] -> {video_id}")
            else:
                links[str_id] = "Ywyei5orJ2M"
                print(f"[{title}] -> Failed, using fallback", flush=True)
                
        except Exception as e:
            links[str_id] = "Ywyei5orJ2M"
            print(f"[{title}] -> Error: {e}", flush=True)
            
        # Save incrementally
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(links, f, indent=4)
            
    print("Done fetching ALL trailers!", flush=True)

if __name__ == "__main__":
    fetch_trailers()
