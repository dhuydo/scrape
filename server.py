from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
import os
import uvicorn

app = FastAPI()

# Cache data khi khởi động
df1_cache = None
df2_cache = None

def load_df1():
    global df1_cache
    if df1_cache is not None:
        return df1_cache
    
    file_path = "processed/columns_20.xlsx"
    if not os.path.exists(file_path):
        return None
    
    df = pd.read_excel(file_path)
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
    df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')
    df1_cache = df.to_dict(orient="records")
    print(f"✅ Cached df1: {len(df1_cache)} records")
    return df1_cache

def load_df2():
    global df2_cache
    if df2_cache is not None:
        return df2_cache
    
    file_path = "processed/merged_columns_13_14.xlsx"
    if not os.path.exists(file_path):
        return None
    
    df = pd.read_excel(file_path)
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
    df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')
    df2_cache = df.to_dict(orient="records")
    print(f"✅ Cached df2: {len(df2_cache)} records")
    return df2_cache

# Load data khi start server
@app.on_event("startup")
async def startup_event():
    print("🚀 Loading data into cache...")
    load_df1()
    load_df2()
    print("✅ Data cached successfully")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return FileResponse("index.html")

@app.get("/style.css")
def get_css():
    return FileResponse("style.css", media_type="text/css")

@app.get("/script.js")
def get_script():
    return FileResponse("script.js", media_type="application/javascript")

@app.get("/search-form.js")
def get_search_form():
    return FileResponse("search-form.js", media_type="application/javascript")

@app.get("/api/df1")
def get_df1():
    """Load dữ liệu từ cache"""
    try:
        data = load_df1()
        if data is None:
            return {"success": False, "error": "File not found", "data": []}
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e), "data": []}

@app.get("/api/df2")
def get_df2():
    """Load dữ liệu từ cache"""
    try:
        data = load_df2()
        if data is None:
            return {"success": False, "error": "File not found", "data": []}
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e), "data": []}

if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
