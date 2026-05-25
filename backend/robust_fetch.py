import sqlite3
import json
import os
import subprocess
import sys

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
    
    print("Starting robust yt-dlp scraping for missing movies...")
    
    for movie_id, title in movies:
        str_id = str(movie_id)
        # Skip if already uniquely mapped
        if str_id in links and links[str_id] != "Ywyei5orJ2M" and links[str_id] != "":
            continue
            
        safe_title = title.encode("ascii", "ignore").decode()
            
        try:
            cmd = [sys.executable, "-m", "yt_dlp", f"ytsearch1:{safe_title} official trailer", "--get-id"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0 and result.stdout.strip():
                video_id = result.stdout.strip().split('\n')[0]
                links[str_id] = video_id
                print(f"[{safe_title}] -> {video_id}", flush=True)
            else:
                links[str_id] = "Ywyei5orJ2M"
                print(f"[{safe_title}] -> Failed, using fallback", flush=True)
                
        except Exception as e:
            links[str_id] = "Ywyei5orJ2M"
            print(f"[{safe_title}] -> Error", flush=True)
            
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(links, f, indent=4)
            
    print("Done fetching ALL trailers!", flush=True)

if __name__ == "__main__":
    fetch_trailers()
