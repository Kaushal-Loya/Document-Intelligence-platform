"""
URL configuration for API endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Book APIs
    path('books/', views.book_list, name='book-list'),
    path('books/<int:pk>/', views.book_detail, name='book-detail'),
    path('books/<int:pk>/recommendations/', views.book_recommendations, name='book-recommendations'),
    
    # Q&A APIs
    path('ask/', views.ask_question, name='ask-question'),
    path('chat/<str:session_id>/history/', views.chat_history, name='chat-history'),
    
    # Stats & Metadata
    path('genres/', views.genres_list, name='genres-list'),
    path('stats/', views.stats, name='stats'),
]
