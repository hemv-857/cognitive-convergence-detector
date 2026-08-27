"""Fetch SEC 13-F filings (free public data) for validation."""

import logging

import httpx

logger = logging.getLogger(__name__)

EDGAR_BASE = "https://efts.sec.gov/LATEST"
HEADERS = {"User-Agent": "ConvergenceDetector research@example.com"}


async def fetch_recent_13f_filings(max_results: int = 50) -> list[dict]:
    """Fetch recent 13-F filings from SEC EDGAR."""
    url = f"{EDGAR_BASE}/search-index?q=%2213F%22&dateRange=custom&startdt=2024-01-01&forms=13F-HR"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            hits = data.get("hits", {}).get("hits", [])[:max_results]
            return [
                {
                    "cik": hit.get("_source", {}).get("entity_name", ""),
                    "filed": hit.get("_source", {}).get("file_date", ""),
                    "form_type": "13F-HR",
                }
                for hit in hits
            ]
    except Exception as e:
        logger.error(f"EDGAR fetch failed: {e}")
        return []
