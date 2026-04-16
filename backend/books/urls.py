"""URL patterns for the books API."""
from django.urls import path
from . import views

urlpatterns = [
    # Book CRUD + listing
    path('books/', views.book_list, name='book-list'),
    path('books/<int:pk>/', views.book_detail, name='book-detail'),
    path('books/<int:pk>/delete/', views.book_delete, name='book-delete'),
    path('books/<int:pk>/recommend/', views.book_recommend, name='book-recommend'),

    # Processing
    path('books/upload/', views.book_upload, name='book-upload'),
    path('books/scrape/', views.book_scrape, name='book-scrape'),
    path('books/ingest/', views.book_ingest, name='book-ingest'),
    path('books/ask/', views.book_ask, name='book-ask'),

    # Supporting
    path('chat-history/', views.chat_history, name='chat-history'),
    path('stats/', views.stats, name='stats'),
]
