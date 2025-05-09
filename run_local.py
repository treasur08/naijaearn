import os
import json
import time
import requests
from django.core.management import execute_from_command_line
from dotenv import load_dotenv

load_dotenv()

def get_ngrok_url():
    try:
        response = requests.get('http://localhost:4040/api/tunnels')
        tunnels = response.json()['tunnels']
        return tunnels[0]['public_url']
    except:
        return None



def update_env_with_ngrok(ngrok_url):
    domain = ngrok_url.replace('https://', '').replace('http://', '')
    
    with open('.env', 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    for i, line in enumerate(lines):
        if line.startswith('ALLOWED_HOSTS='):
            lines[i] = f"ALLOWED_HOSTS='localhost, 127.0.0.1, {ngrok_url}, {domain}'\n"
        elif line.startswith('WEBSITE_URL'):
            lines[i] = f"WEBSITE_URL = '{ngrok_url}'\n"
    
    
    with open('.env', 'w', encoding='utf-8') as file:
        file.writelines(lines)
def run_django():
    # Get ngrok URL from already running ngrok
    ngrok_url = get_ngrok_url()
    
    if ngrok_url:
        print(f"Found ngrok URL: {ngrok_url}")
        update_env_with_ngrok(ngrok_url)
    else:
        print("Please start ngrok in a separate terminal with: ngrok http 8000")
        time.sleep(2)
    
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fluxx_earn.settings")
    execute_from_command_line(["manage.py", "runserver"])

if __name__ == "__main__":
    run_django()
