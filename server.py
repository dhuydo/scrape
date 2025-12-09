from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import os
import uvicorn
import json
from pathlib import Path
from datetime import datetime
import re

# ========== GLOBAL CACHE ==========
df1_cache = None
df2_cache = None
metadata_cache = None

def extract_province(text):
    match = re.search(r'(Tỉnh|Thành phố)\s+[A-Za-zÀ-ỹ\s]+', text)
    return match.group(0).replace(";", "").strip() if match else None

def load_df1():
    global df1_cache
    if df1_cache is not None:
        return df1_cache
    
    file_path = "processed/columns_20.xlsx"
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None
    
    df = pd.read_excel(file_path)
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})

    df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
    df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')

    df.drop(['Mã phần lô', 'Mã thuốc', 'Tiến độ cung cấp'], axis=1, inplace=True)
        
    df["Địa điểm"] = df["Địa điểm"].apply(extract_province)

    df["Tình trạng hiệu lực"] = (df["Ngày hết hiệu lực"]
                                   .apply(lambda d: "Còn hiệu lực" if pd.notna(d) and d >= pd.Timestamp.today().normalize() else "Hết hiệu lực")
    )

    df1_cache = df.to_dict(orient="records")
    print(f"✅ Cached df1: {len(df1_cache)} records")
    return df1_cache


def load_df2():
    global df2_cache
    if df2_cache is not None:
        return df2_cache
    
    file_path = "processed/merged_columns_13_14.xlsx"
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None
    
    df = pd.read_excel(file_path)
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    
    df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
    df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')
  
    df["Địa điểm"] = df["Địa điểm"].apply(extract_province)

    df["Tình trạng hiệu lực"] = (df["Ngày hết hiệu lực"]
                                   .apply(lambda d: "Còn hiệu lực" if pd.notna(d) and d >= pd.Timestamp.today().normalize() else "Hết hiệu lực")
    )
    
    df2_cache = df.to_dict(orient="records")
    print(f"✅ Cached df2: {len(df2_cache)} records")
    return df2_cache


def load_metadata_cache():
    global metadata_cache
    try:
        file_path = "run_history.json"
        if Path(file_path).exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
            
            if history:
                latest = history[-1]
                today_str = latest.get("end_time", "").split(' ')[0]
                today_runs = sum(1 for run in history[-10:] if run.get("end_time", "").startswith(today_str))
                
                # ✅ THÊM HISTORY VÀO RESPONSE
                metadata_cache = {
                    "success": True,
                    "history": history,
                    "last_run": latest,
                    "last_run_end": latest.get("end_time"),
                    "duration_seconds": latest.get("duration_seconds", 0),
                    "boxes_selected": latest.get("boxes_selected", 0),
                    "runs_today": today_runs,
                    "total_runs": len(history)
                }
                print(f"✅ Metadata cached: {len(history)} total runs, {today_runs} runs today")
                return
        
        metadata_cache = {
            "success": False,
            "message": "Chưa có file run_history.json hoặc chưa có dữ liệu",
            "history": [], 
            "runs_today": 0
        }
        print("ℹ️ No metadata file found")
    except Exception as e:
        print(f"❌ Error loading metadata cache: {e}")
        metadata_cache = {
            "success": False,
            "error": str(e),
            "history": [],
            "runs_today": 0
        }

# ========== LIFESPAN (CHỈ 1 HÀM DUY NHẤT) ==========
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    load_df1()
    load_df2()
    load_metadata_cache()
    print("✅ Data & metadata cached successfully")
    
    yield
    
    print("🛑 Shutting down gracefully...")


# ========== FASTAPI APP ==========
app = FastAPI(lifespan=lifespan)


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


@app.get("/api/metadata")
def get_metadata():
    """API trả về metadata từ cache"""
    return metadata_cache or {
        "success": False,
        "message": "Chưa có lịch sử cập nhật",
        "runs_today": 0
    }


@app.get("/api/df1")
def get_df1():
    """Load dữ liệu từ cache"""
    try:
        data = load_df1()
        if data is None:
            return {"success": False, "error": "File not found", "data": []}
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        print(f"❌ Error df1: {str(e)}")
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
        print(f"❌ Error df2: {str(e)}")
        return {"success": False, "error": str(e), "data": []}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
