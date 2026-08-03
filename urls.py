from django.contrib import admin
from django.urls import path
import views

urlpatterns = [
    path('', views.index, name='index'),
    path("get-products/<str:category>/", views.get_products, name="get_products"),
    path("chat-with-ai/", views.chat_with_ai, name="chat_with_ai"),
]
