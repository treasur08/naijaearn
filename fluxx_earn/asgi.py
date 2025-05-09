"""
ASGI config for fluxx_earn project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

import asyncio

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fluxx_earn.settings')

application = get_asgi_application()
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)























