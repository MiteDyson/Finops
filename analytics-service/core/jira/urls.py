from django.urls import path
from . import views

urlpatterns = [
    path('test-ticket/', views.test_ticket, name='test_ticket'),
]
