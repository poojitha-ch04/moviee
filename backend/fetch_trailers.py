import sqlite3
import json
import os
import subprocess
import sys
import time

DB_PATH = "moviee.db"
JSON_PATH = "trailer_links.json"

def fetch_trailers():
    # Load existing links to avoid re-fetching
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            links = json.load(f)
    else:
        links = {}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM movies")
    movies = cursor.fetchall()
    
    print(f"Found {len(movies)} movies. Starting YouTube scraping...")
    
    for movie_id, title in movies:
        str_id = str(movie_id)
        if str_id in links:
            continue
            
        print(f"Fetching trailer for: {title}")
        try:
            cmd = [sys.executable, "-m", "yt_dlp", f"ytsearch1:{title} official trailer", "--get-id"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0 and result.stdout.strip():
                video_id = result.stdout.strip().split('\n')[0]
                links[str_id] = video_id
                print(f"  -> Found ID: {video_id}")
                
                # Save immediately after each success to prevent data loss
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(links, f, indent=4)
            else:
                print(f"  -> Failed to find video for {title}")
                # Fallback to a generic ID so UI doesn't break
                links[str_id] = "Ywyei5orJ2M"
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(links, f, indent=4)
                    
        except Exception as e:
            print(f"  -> Error: {e}")
            links[str_id] = "Ywyei5orJ2M"
            
        time.sleep(0.5) # small delay to avoid excessive spam
        
    print("Done fetching trailers!")

if __name__ == "__main__":
    fetch_trailers()
