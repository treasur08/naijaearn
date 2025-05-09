from django.apps import AppConfig
from django.conf import settings
from asgiref.sync import async_to_sync
import os
import sys
import asyncio
import threading

class BotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bot'

    def ready(self):
        
        print("Bot initialization skipped")