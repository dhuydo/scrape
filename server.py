from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve index.html at root
@app.get("/")
def root():
    return FileResponse("index.html")

# Serve các file CSS
@app.get("/style.css")
def get_css():
    return FileResponse("style.css", media_type="text/css")

# Serve các file JS
@app.get("/script.js")
def get_script():
    return FileResponse("script.js", media_type="application/javascript")

@app.get("/search-form.js")
def get_search_form():
    return FileResponse("search-form.js", media_type="application/javascript")

# API endpoints giữ nguyên
@app.get("/api/df1")
def get_df1():
    """Load dữ liệu trước 01/07/2025 (columns_20.xlsx)"""
    try:
        file_path = "processed/columns_20.xlsx"
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}", "data": []}
        
        df = pd.read_excel(file_path)
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
        df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')
        data = df.to_dict(orient="records")
        
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}

@app.get("/api/df2")
def get_df2():
    """Load dữ liệu sau 01/07/2025 (merged_columns_13_14.xlsx)"""
    try:
        file_path = "processed/merged_columns_13_14.xlsx"
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}", "data": []}
        
        df = pd.read_excel(file_path)
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
        df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')
        data = df.to_dict(orient="records")
        
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
