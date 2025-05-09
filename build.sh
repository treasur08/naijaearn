#!/bin/bash
export PYTHONUTF8=1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py dumpdata --natural-primary --natural-foreign --indent 4 > backup.json

if [ "$CREATE_SUPERUSER" = "True" ]; then
    python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD') if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists() else None"
fi
