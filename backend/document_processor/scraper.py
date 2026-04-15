"""
Selenium-based book scraper for collecting book data from web sources.
"""
import re
import time
from typing import Dict, Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup


class BookScraper:
    """Scraper for collecting book data."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None
        
    def _init_driver(self):
        """Initialize Chrome driver."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        
    def _close_driver(self):
        """Close the driver."""
        if self.driver:
            self.driver.quit()
            self.driver = None
    
    def scrape_goodreads(self, url: str) -> Dict:
        """
        Scrape book data from Goodreads URL.
        Returns dict with title, author, rating, reviews, description.
        """
        self._init_driver()
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract title
            title_elem = soup.select_one('h1[data-testid="bookTitle"]')
            title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"
            
            # Extract author
            author_elem = soup.select_one('a[class*="ContributorLink__name"]')
            if not author_elem:
                author_elem = soup.select_one('span[data-testid="name"]')
            author = author_elem.get_text(strip=True) if author_elem else "Unknown Author"
            
            # Extract rating
            rating_elem = soup.select_one('div[class*="RatingStatistics__rating"]')
            rating = None
            if rating_elem:
                try:
                    rating = float(rating_elem.get_text(strip=True))
                except ValueError:
                    pass
            
            # Extract reviews count
            reviews_elem = soup.select_one('span[data-testid="reviewsCount"]')
            reviews_count = 0
            if reviews_elem:
                reviews_text = reviews_elem.get_text(strip=True)
                reviews_match = re.search(r'([\d,]+)', reviews_text)
                if reviews_match:
                    reviews_count = int(reviews_match.group(1).replace(',', ''))
            
            # Extract description
            desc_elem = soup.select_one('div[data-testid="description"]')
            description = ""
            if desc_elem:
                # Get all paragraphs
                paragraphs = desc_elem.find_all('p')
                description = ' '.join([p.get_text(strip=True) for p in paragraphs])
                if not description:
                    description = desc_elem.get_text(strip=True)
            
            # Extract reviews for sentiment analysis
            review_elements = soup.select('section[class*="ReviewCard"]')
            reviews = []
            for review in review_elements[:10]:  # Limit to first 10
                review_text = review.get_text(strip=True)
                if review_text:
                    reviews.append(review_text[:500])
            
            return {
                'title': title,
                'author': author,
                'rating': rating,
                'reviews_count': reviews_count,
                'description': description,
                'book_url': url,
                'raw_reviews': reviews,
                'source': 'goodreads'
            }
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            return {
                'title': 'Unknown',
                'author': 'Unknown',
                'rating': None,
                'reviews_count': 0,
                'description': '',
                'book_url': url,
                'raw_reviews': [],
                'error': str(e)
            }
        finally:
            self._close_driver()
    
    def scrape_generic(self, url: str, title_selector: str = None, 
                     content_selector: str = None) -> Dict:
        """
        Generic scraper for any book-related URL.
        Extracts all text content for later processing.
        """
        self._init_driver()
        
        try:
            self.driver.get(url)
            time.sleep(2)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get title
            title = soup.title.get_text(strip=True) if soup.title else "Unknown"
            
            # Get main content
            if content_selector:
                content_elem = soup.select_one(content_selector)
                content = content_elem.get_text(strip=True) if content_elem else ""
            else:
                content = soup.get_text(separator=' ', strip=True)
            
            # Clean up whitespace
            content = re.sub(r'\s+', ' ', content).strip()[:10000]  # Limit length
            
            return {
                'title': title,
                'author': 'Unknown',
                'rating': None,
                'reviews_count': 0,
                'description': content,
                'book_url': url,
                'raw_reviews': [],
                'source': 'generic'
            }
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            return {
                'title': 'Unknown',
                'author': 'Unknown',
                'rating': None,
                'reviews_count': 0,
                'description': '',
                'book_url': url,
                'raw_reviews': [],
                'error': str(e)
            }
        finally:
            self._close_driver()
