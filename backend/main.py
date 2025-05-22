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
    return {
        "ticker": ticker,
        "history": hist.to_dict(orient="records")
    }

@app.get("/screener/value")
def value_screener(
    exchange: str = Query("NASDAQ", description="Stock exchange (e.g., NASDAQ, NYSE)"),
    peg_weight: float = Query(1.0),
    forward_pe_weight: float = Query(1.0),
    pe_ttm_weight: float = Query(1.0),
    ps_weight: float = Query(1.0),
    pb_weight: float = Query(1.0),
    projected_growth_weight: float = Query(1.0),
    limit: int = Query(20)
):
    # For demo: use a static list of tickers per exchange (replace with dynamic fetch for production)
    exchange_tickers = {
        "NASDAQ": ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "PEP", "AVGO", "COST"],
        "NYSE": ["JNJ", "V", "PG", "JPM", "MA", "UNH", "HD", "DIS", "BAC", "VZ"]
    }
    tickers = exchange_tickers.get(exchange.upper(), exchange_tickers["NASDAQ"])

    results = []
    for ticker in tickers:
        try:
            info = yf.Ticker(ticker).info
            # Get metrics, use None if not available
            peg = info.get("pegRatio")
            forward_pe = info.get("forwardPE")
            pe_ttm = info.get("trailingPE")
            ps = info.get("priceToSalesTrailing12Months")
            pb = info.get("priceToBook")
            projected_growth = info.get("earningsQuarterlyGrowth")
            # Invert metrics where lower is better (PE, PB, PS, PEG)
            score = 0
            count = 0
            if peg and peg > 0:
                score += peg_weight / peg
                count += peg_weight
            if forward_pe and forward_pe > 0:
                score += forward_pe_weight / forward_pe
                count += forward_pe_weight
            if pe_ttm and pe_ttm > 0:
                score += pe_ttm_weight / pe_ttm
                count += pe_ttm_weight
            if ps and ps > 0:
                score += ps_weight / ps
                count += ps_weight
            if pb and pb > 0:
                score += pb_weight / pb
                count += pb_weight
            if projected_growth and projected_growth > 0:
                score += projected_growth_weight * projected_growth
                count += projected_growth_weight
            if count > 0:
                final_score = score / count
            else:
                final_score = 0
            results.append({
                "ticker": ticker,
                "shortName": info.get("shortName"),
                "peg": peg,
                "forward_pe": forward_pe,
                "pe_ttm": pe_ttm,
                "ps": ps,
                "pb": pb,
                "projected_growth": projected_growth,
                "score": final_score
            })
        except Exception as e:
            continue

    # Sort by score descending and return top N
    results = sorted(results, key=lambda x: x["score"], reverse=True)[:limit]
    return {"exchange": exchange, "results": results} 