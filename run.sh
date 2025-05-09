#!/bin/bash

# Start the Telegram bot in the background
python bot/telegram_bot.py &

# Start the Django application with gunicorn
gunicorn fluxx_earn.wsgi:application

