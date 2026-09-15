from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
from django.views.static import serve
import os

def api_root(request):
    return JsonResponse({
        'name': 'OmniRoom API',
        'status': 'online',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'meetings': '/api/meetings/',
            'files': '/api/files/',
            'whiteboard': '/api/whiteboard/'
        }
    })

def serve_frontend_file(request, path='index.html'):
    frontend_dir = settings.PROJECT_ROOT / 'frontend'
    if not frontend_dir.exists():
        frontend_dir = settings.BASE_DIR / 'frontend'
    
    if not frontend_dir.exists():
        return JsonResponse({
            'name': 'OmniRoom API',
            'status': 'online',
            'message': 'API is running. Frontend static files are served separately.'
        })

    clean_path = path.strip('/')
    if not clean_path:
        clean_path = 'index.html'

    # 1. Direct file match
    file_path = frontend_dir / clean_path
    if file_path.exists() and file_path.is_file():
        return serve(request, clean_path, document_root=str(frontend_dir))

    # 2. Match with .html extension (e.g. /register -> /register.html)
    html_candidate = frontend_dir / f"{clean_path}.html"
    if html_candidate.exists() and html_candidate.is_file():
        return serve(request, f"{clean_path}.html", document_root=str(frontend_dir))

    # 3. Handle nested JS / CSS requests with leading path segments (e.g. /app/js/api.js or /register/js/api.js)
    if 'js/' in clean_path:
        js_rel = 'js/' + clean_path.split('js/', 1)[1]
        js_file = frontend_dir / js_rel
        if js_file.exists() and js_file.is_file():
            return serve(request, js_rel, document_root=str(frontend_dir))

    if 'css/' in clean_path:
        css_rel = 'css/' + clean_path.split('css/', 1)[1]
        css_file = frontend_dir / css_rel
        if css_file.exists() and css_file.is_file():
            return serve(request, css_rel, document_root=str(frontend_dir))

    # 4. If an actual JS or CSS file does not exist, return 404 rather than serving index.html
    if clean_path.endswith('.js') or clean_path.endswith('.css') or clean_path.endswith('.map'):
        from django.http import Http404
        raise Http404(f"Asset '{clean_path}' not found.")

    # 5. Fallback for SPA routing to index.html
    index_candidate = frontend_dir / 'index.html'
    if index_candidate.exists():
        return serve(request, 'index.html', document_root=str(frontend_dir))
    
    return JsonResponse({'error': 'Page not found'}, status=404)

def firebase_config_view(request):
    """Serve client-side Firebase configuration loaded securely from .env environment variables."""
    return JsonResponse({
        'apiKey': os.getenv('FIREBASE_API_KEY') or getattr(settings, 'FIREBASE_API_KEY', ''),
        'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN') or getattr(settings, 'FIREBASE_AUTH_DOMAIN', ''),
        'projectId': os.getenv('FIREBASE_PROJECT_ID') or getattr(settings, 'FIREBASE_PROJECT_ID', ''),
        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET') or getattr(settings, 'FIREBASE_STORAGE_BUCKET', ''),
        'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID') or getattr(settings, 'FIREBASE_MESSAGING_SENDER_ID', ''),
        'appId': os.getenv('FIREBASE_APP_ID') or getattr(settings, 'FIREBASE_APP_ID', ''),
        'measurementId': os.getenv('FIREBASE_MEASUREMENT_ID') or getattr(settings, 'FIREBASE_MEASUREMENT_ID', ''),
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/config/firebase/', firebase_config_view, name='firebase-config'),
    path('api/auth/', include('accounts.urls')),
    path('api/meetings/', include('meetings.urls')),
    path('api/files/', include('files.urls')),
    path('api/whiteboard/', include('whiteboard.urls')),

    # Root route serves index.html directly
    path('', serve_frontend_file, {'path': 'index.html'}),
    path('app/<path:path>', serve_frontend_file),
    path('<path:path>', serve_frontend_file),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    frontend_dir = settings.PROJECT_ROOT / 'frontend'
    if not frontend_dir.exists():
        frontend_dir = settings.BASE_DIR / 'frontend'
    if frontend_dir.exists():
        urlpatterns += static(settings.STATIC_URL, document_root=frontend_dir)


