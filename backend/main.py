from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stocks")
def get_stock_data(ticker: str = Query(..., description="Stock ticker symbol")):
    stock = yf.Ticker(ticker)
    info = stock.info
    return {
        "ticker": ticker,
        "shortName": info.get("shortName"),
        "currentPrice": info.get("currentPrice"),
        "previousClose": info.get("previousClose"),
        "open": info.get("open"),
        "dayHigh": info.get("dayHigh"),
        "dayLow": info.get("dayLow"),
        "volume": info.get("volume"),
        "marketCap": info.get("marketCap"),
        "trailingPE": info.get("trailingPE"),
        "forwardPE": info.get("forwardPE"),
        "dividendYield": info.get("dividendYield"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
    }

@app.get("/stocks/history")
def get_stock_history(ticker: str = Query(..., description="Stock ticker symbol")):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="5y")
    hist = hist.reset_index()
    hist['Date'] = hist['Date'].astype(str)
    # Return all columns
    return {
        "ticker": ticker,
        "history": hist.to_dict(orient="records")
    }