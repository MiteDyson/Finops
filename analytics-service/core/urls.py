from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/anomaly/', include('core.anomaly.urls')),
    path('api/jira/', include('core.jira.urls')),
]
