from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import csv
import os

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
    exchange: str = Query("NASDAQ", description="Stock exchange (e.g., NASDAQ, NYSE, OSE)"),
    peg_weight: float = Query(1.0),
    forward_pe_weight: float = Query(1.0),
    pe_ttm_weight: float = Query(1.0),
    ps_weight: float = Query(1.0),
    pb_weight: float = Query(1.0),
    projected_growth_weight: float = Query(1.0),
    fcf_yield_weight: float = Query(1.0),
    dividend_yield_weight: float = Query(1.0),
    return_on_equity_weight: float = Query(1.0),
    limit: int = Query(20)
):
    exchange_tickers = {
        "NASDAQ": ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "PEP", "AVGO", "COST"],
        "NYSE": ["JNJ", "V", "PG", "JPM", "MA", "UNH", "HD", "DIS", "BAC", "VZ"],
        # OSE will be loaded dynamically below
    }
    if exchange.upper() == "OSE":
        ose_tickers = []
        csv_path = os.path.join(os.path.dirname(__file__), "euronext_equities.csv")
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                if row.get('Market') == 'Oslo Børs' and row.get('Symbol'):
                    ose_tickers.append(f"{row['Symbol']}.OL")
        tickers = ose_tickers
    else:
        tickers = exchange_tickers.get(exchange.upper(), exchange_tickers["NASDAQ"])

    results = []
    for ticker in tickers:
        try:
            info = yf.Ticker(ticker).info
            peg = info.get("pegRatio")
            forward_pe = info.get("forwardPE")
            pe_ttm = info.get("trailingPE")
            ps = info.get("priceToSalesTrailing12Months")
            pb = info.get("priceToBook")
            projected_growth = info.get("earningsQuarterlyGrowth")
            free_cash_flow = info.get("freeCashflow")
            market_cap = info.get("marketCap")
            fcf_yield = (free_cash_flow / market_cap) if free_cash_flow and market_cap and market_cap > 0 else None
            dividend_yield = info.get("dividendYield")
            return_on_equity = info.get("returnOnEquity")
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
            if fcf_yield and fcf_yield > 0:
                score += fcf_yield_weight * fcf_yield
                count += fcf_yield_weight
            if dividend_yield and dividend_yield > 0:
                score += dividend_yield_weight * dividend_yield
                count += dividend_yield_weight
            if return_on_equity and return_on_equity > 0:
                score += return_on_equity_weight * return_on_equity
                count += return_on_equity_weight
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
                "fcf_yield": fcf_yield,
                "dividend_yield": dividend_yield,
                "return_on_equity": return_on_equity,
                "score": final_score
            })
        except Exception as e:
            continue

    results = sorted(results, key=lambda x: x["score"], reverse=True)[:limit]
    return {"exchange": exchange, "results": results} 