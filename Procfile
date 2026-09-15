web: cd backend && daphne -b 0.0.0.0 -p $PORT --proxy-headers config.asgi:application
release: python backend/manage.py migrate
