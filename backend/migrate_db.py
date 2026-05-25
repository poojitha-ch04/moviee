import sqlite3

def apply_migrations():
    conn = sqlite3.connect('c:/Users/DELL/Downloads/moviee/backend/moviee.db')
    cursor = conn.cursor()
    
    # Add avatar_url to users if not exists
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR")
    except sqlite3.OperationalError:
        pass # Probably already exists
        
    # Create followers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER,
        followed_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(follower_id) REFERENCES users(id),
        FOREIGN KEY(followed_id) REFERENCES users(id)
    )
    """)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    apply_migrations()
