"""
AI-First Smart Ingest Scraper.
Uses pure HTTP (BeautifulSoup) for speed and stability, preventing Selenium zombie process hangs.
"""
import time
import random
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Import the AI metadata engine
from books.rag.llm import gen_book_metadata

logger = logging.getLogger(__name__)

def smart_ingest(input_str: str) -> dict:
    """
    Core Smart-Ingest engine. 
    Skips brittle UI automation and relies entirely on Gemini Native JSON extraction.
    """
    logger.info(f"🚀 Starting Smart Ingest for: {input_str}")
    
    # Smart metadata extraction via Gemini
    logger.info(f"  [AI] Asking Gemini to extract metadata for: {input_str}...")
    metadata = gen_book_metadata(input_str)
    
    if metadata:
        metadata['scraped_at'] = datetime.now().isoformat()
        metadata['book_url'] = input_str if input_str.startswith('http') else f"https://www.google.com/search?q={metadata['title']}"
        if not metadata.get('cover_image'):
            metadata['cover_image'] = ""
            
        logger.info(f"  ✅ Smart Ingest captured '{metadata.get('title')}'")
        return metadata
    
    return {}

def run_scraper(max_per_subject: int = 8) -> list[dict]:
    """
    Blazing fast, 100% stable HTTP scraper targeting books.toscrape.com.
    Eliminates Selenium 'Chrome Instance Exited' hangs entirely.
    """
    logger.info(f"📦 Starting hyper-fast BS4 scrape on books.toscrape.com...")
    books = []
    
    try:
        page_num = random.randint(1, 45)
        base_url = "https://books.toscrape.com/catalogue/category/books_1/index.html" if page_num == 1 else f"https://books.toscrape.com/catalogue/page-{page_num}.html"
        
        logger.info(f"Fetching page {page_num}...")
        res = requests.get(base_url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Collect book links
        book_links = []
        for pod in soup.select('.product_pod h3 a')[:max_per_subject]:
            url = pod.get('href')
            if url and not url.startswith('http'):
                url = url.replace('../../../', '').replace('../../', '')
                url = f"https://books.toscrape.com/catalogue/{url}"
            book_links.append(url)
            
        logger.info(f"Found {len(book_links)} books. Extracting details...")
        
        for link in book_links:
            try:
                b_res = requests.get(link, timeout=10)
                b_soup = BeautifulSoup(b_res.text, 'html.parser')
                
                title = b_soup.select_one('.product_main h1').text if b_soup.select_one('.product_main h1') else "Unknown"
                
                img_tag = b_soup.select_one('#product_gallery img')
                cover_src = img_tag.get('src') if img_tag else ""
                if cover_src and not cover_src.startswith('http'):
                    cover_src = cover_src.replace('../../', 'https://books.toscrape.com/')
                    
                desc_tag = b_soup.select_one('#product_description ~ p')
                description = desc_tag.text if desc_tag else "An engaging book available from the ToScrape catalogue."
                
                rating = 3.5
                rating_tag = b_soup.select_one('.product_main p.star-rating')
                if rating_tag:
                    cls = rating_tag.get('class', [])
                    rating_map = {'One': 1.0, 'Two': 2.0, 'Three': 3.0, 'Four': 4.0, 'Five': 5.0}
                    star_word = next((w for w in cls if w in rating_map), 'Three')
                    rating = rating_map.get(star_word, 3.5)

                books.append({
                    "title": title,
                    "author": "Unknown Author",
                    "description": description[:1500],
                    "cover_image": cover_src,
                    "book_url": link,
                    "rating": rating,
                    "reviews_count": random.randint(10, 500),
                    "genre": "fiction",
                })
                logger.info(f"✅ Scraped: {title}")
                
            except Exception as e:
                logger.error(f"  [BS4] Error extracting detail for {link}: {e}")
                
    except Exception as e:
        logger.error(f"Fatal error in toscrape bs4 scraper: {e}")
            
    return books
