from sqlalchemy import text
from app.database import engine

with engine.connect() as c:
    try:
        rows = c.execute(text("select name from vault.secrets limit 20")).fetchall()
        print("vault secrets names:", rows)
    except Exception as e:
        print("vault error:", e)
