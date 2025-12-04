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

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def root():
    return FileResponse("index.html")

@app.get("/api/df1")
def get_df1():
    """Load dữ liệu trước 01/07/2025 (columns_20.xlsx)"""
    try:
        file_path = "processed/columns_20.xlsx"
        
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}", "data": []}
        
        df = pd.read_excel(file_path)
        
        # FIX: Thay NaN bằng None để JSON serialize được
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
        df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')

        data = df.to_dict(orient="records")
        
        print(f"✅ Loaded {len(data)} records from df1")
        print(f"📋 Columns: {list(df.columns)}")

        print(f"📅 First date: {data[0].get('Ngày phê duyệt')}")
        print(f"📅 Last date: {data[-1].get('Ngày phê duyệt')}")

        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        print(f"❌ Error loading df1: {str(e)}")
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
        
        # FIX: Thay NaN bằng None để JSON serialize được
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        df['Ngày phê duyệt'] = pd.to_datetime(df['Ngày phê duyệt'], format='%d/%m/%Y', errors='coerce')
        df = df.sort_values('Ngày phê duyệt', ascending=False, na_position='last')

        data = df.to_dict(orient="records")
        
        print(f"✅ Loaded {len(data)} records from df2")
        print(f"📋 Columns: {list(df.columns)}")
        
        print(f"📅 First date: {data[0].get('Ngày phê duyệt')}")
        print(f"📅 Last date: {data[-1].get('Ngày phê duyệt')}")

        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        print(f"❌ Error loading df2: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
