import logging
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, Bot, ChatMember, InputMediaPhoto
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler, MessageHandler, filters
from telegram.error import TelegramError
import os
import httpx
from dotenv import load_dotenv
load_dotenv()
# Configuration
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
WEBSITE_URL = os.environ.get('WEBSITE_URL')
BOT_USERNAME = os.environ.get('BOT_USERNAME', 'EarnTask1bot')
API_BASE_URL = os.environ.get('WEBSITE_URL')  # Update this to your Django API URL

# Setup logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and HTTP client
bot = Bot(TELEGRAM_BOT_TOKEN)
httpx_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=10.0
)

async def create_or_get_user(telegram_id, first_name, profile_photo_url):
    try:
        response = await httpx_client.post(
            f"{API_BASE_URL}/api/user/create/",
            json={
                'telegram_id': telegram_id,
                'first_name': first_name,
                'profile_photo_url': profile_photo_url
            }
        )
        response.raise_for_status()
        data = response.json()
        return data['user'], data['created']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return None, False

async def handle_referral(referrer_id, user_id):
    try:
        response = await httpx_client.post(
            f"{API_BASE_URL}/referral/handle/",
            json={
                'referrer_id': referrer_id,
                'user_id': user_id
            }
        )
        response.raise_for_status()
        return response.json()['success']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return False

async def mark_channel_as_joined(user_id, channel_id):
    try:
        response = await httpx_client.post(
            f"{API_BASE_URL}/channel/joined/",
            json={
                'user_id': user_id,
                'channel_id': channel_id
            }
        )
        response.raise_for_status()
        return response.json()['success']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return False

async def get_all_channels():
    try:
        response = await httpx_client.get(f"{API_BASE_URL}/channels/")
        response.raise_for_status()
        return response.json()['channels']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return []

async def get_all_user_ids():
    try:
        response = await httpx_client.get(f"{API_BASE_URL}/users/")
        response.raise_for_status()
        return response.json()['user_ids']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return []

async def is_admin(user_id):
    try:
        response = await httpx_client.get(f"{API_BASE_URL}/api/admin/check/{user_id}/")
        response.raise_for_status()
        return response.json()['is_admin']
    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        return False

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    profile_photos = await context.bot.get_user_profile_photos(user.id, limit=1)
    profile_photo_url = None
    if profile_photos.photos:
        file = await context.bot.get_file(profile_photos.photos[0][-1].file_id)
        profile_photo_url = file.file_path
    
    db_user, created = await create_or_get_user(user.id, user.first_name, profile_photo_url)
    
    if context.args:
        referrer_id = context.args[0]
        if referrer_id and referrer_id != str(user.id):
            await handle_referral(referrer_id, user.id)

    LOCAL_URL = f"{WEBSITE_URL}/activate/?user_id={user.id}"
    keyboard = [
        [InlineKeyboardButton("NAIJA EARN App", web_app={"url": LOCAL_URL})],
        [InlineKeyboardButton("Join Community", url="https://t.me/allcoin_swaps")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"Hi {user.first_name}, welcome to NAIJAEARN! Earn rewards by completing tasks and referring others.",
        reply_markup=reply_markup
    )

async def generate_codes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin command to generate activation codes"""
    user = update.effective_user
    
    # Check if the user is an admin
    if not await is_admin(user.id):
        await update.message.reply_text("You don't have permission to use this command.")
        return
    
    # Check if a count was provided
    if not context.args or len(context.args) != 1:
        await update.message.reply_text("Please provide the number of codes to generate: /gen [count]")
        return
    
    try:
        count = int(context.args[0])
        if count <= 0 or count > 1000:
            await update.message.reply_text("Please provide a number between 1 and 1000.")
            return
        
        # Call API to generate codes
        response = await httpx_client.post(
            f"{API_BASE_URL}/api/admin/generate-codes/",
            json={
                'admin_id': user.id,
                'count': count
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                codes = data.get('codes', [])
                
                # Format the codes in a nice way
                if codes:
                    # Send initial message
                    await update.message.reply_text(f"✅ Generated {len(codes)} activation codes:")
                    
                    # Split codes into chunks to avoid message length limits
                    chunk_size = 50
                    code_chunks = [codes[i:i + chunk_size] for i in range(0, len(codes), chunk_size)]
                    
                    for i, chunk in enumerate(code_chunks):
                        formatted_codes = "\n".join([f"`{code}`" for code in chunk])
                        message = f"Codes {i*chunk_size+1}-{i*chunk_size+len(chunk)}:\n{formatted_codes}"
                        await update.message.reply_text(message, parse_mode="Markdown")
                else:
                    await update.message.reply_text("✅ Codes generated, but no codes were returned.")
            else:
                await update.message.reply_text(f"❌ {data.get('error', 'Failed to generate codes.')}")
        else:
            await update.message.reply_text(f"❌ Error: HTTP {response.status_code}")
            
    except ValueError:
        await update.message.reply_text("Please provide a valid number.")
    except Exception as e:
        logger.error(f"Error generating codes: {str(e)}")
        await update.message.reply_text("❌ An error occurred while processing your request.")


async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not await is_admin(user.id):
        await update.message.reply_text("You don't have permission to use this command.")
        return

    if not context.args:
        await update.message.reply_text("Please provide the broadcast type:\n\n `/broadcast TEXT`, `/broadcast IMAGE`, `/broadcast TEXT_BUTTON`, or `/broadcast IMAGE_TEXT_BUTTON`", parse_mode="Markdown")
        return
    
    broadcast_type = context.args[0].upper()
    if broadcast_type not in ["TEXT", "IMAGE", "TEXT_BUTTON", "IMAGE_TEXT_BUTTON"]:
        await update.message.reply_text("Invalid Broadcast type ❌\n\nPlease provide the broadcast type:\n\n `/broadcast TEXT`, `/broadcast IMAGE`, `/broadcast TEXT_BUTTON`, or `/broadcast IMAGE_TEXT_BUTTON`", parse_mode="Markdown")
        return
  
    await update.message.reply_text(f"Please send the content for {broadcast_type} broadcast.")
    context.user_data['broadcast_type'] = broadcast_type

async def handle_broadcast_content(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not await is_admin(user.id):
        return

    broadcast_type = context.user_data.get('broadcast_type')
    if not broadcast_type:
        return

    if broadcast_type == "TEXT":
        if update.message.text:
            await send_broadcast(update, context, text=update.message.text)
        else:
            await update.message.reply_text("Please send a text message for the broadcast.")

    elif broadcast_type == "IMAGE":
        if update.message.photo:
            await send_broadcast(update, context, image=update.message.photo[-1].file_id, caption=update.message.caption)
        else:
            await update.message.reply_text("Please send an image with optional caption for the broadcast.")

    elif broadcast_type in ["TEXT_BUTTON", "IMAGE_TEXT_BUTTON"]:
        if update.message.text:
            lines = update.message.text.split('\n')
            if len(lines) < 2:
                await update.message.reply_text("Please provide the button text and URL in the format:\nButton Text | https://example.com\nYour message here")
                return
            button_info = lines[0].split('|')
            if len(button_info) != 2:
                await update.message.reply_text("Invalid button format. Please use: Button Text | https://example.com")
                return
            button_text, button_url = button_info[0].strip(), button_info[1].strip()
            message_text = '\n'.join(lines[1:])
            
            if broadcast_type == "TEXT_BUTTON":
                await send_broadcast(update, context, text=message_text, button_text=button_text, button_url=button_url)
            else:  # IMAGE_TEXT_BUTTON
                await update.message.reply_text("Now, please send the image for the broadcast.")
                context.user_data['button_text'] = button_text
                context.user_data['button_url'] = button_url
                context.user_data['message_text'] = message_text
                return
        else:
            await update.message.reply_text("Please send the message content and button information.")

    if broadcast_type == "IMAGE_TEXT_BUTTON" and update.message.photo:
        button_text = context.user_data.get('button_text')
        button_url = context.user_data.get('button_url')
        message_text = context.user_data.get('message_text')
        if button_text and button_url and message_text:
            await send_broadcast(update, context, text=message_text, image=update.message.photo[-1].file_id, button_text=button_text, button_url=button_url)
        else:
            await update.message.reply_text("Something went wrong. Please start the broadcast process again.")

    # Clear the broadcast type after handling
    context.user_data.clear()


async def unlock_user(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin command to unlock a user's account"""
    user = update.effective_user
    
    # Check if the user is an admin
    if not await is_admin(user.id):
        await update.message.reply_text("You don't have permission to use this command.")
        return
    
    # Check if a user ID was provided
    if not context.args or len(context.args) != 1:
        await update.message.reply_text("Please provide a user ID: /unlock [user_id]")
        return
    
    try:
        user_id = context.args[0]
        
        # Call API to unlock the user
        response = await httpx_client.post(
            f"{API_BASE_URL}/api/admin/unlock-user/{user_id}/",
            json={'admin_id': user.id}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                await update.message.reply_text(f"✅ {data.get('message', 'User account unlocked successfully.')}")
            else:
                await update.message.reply_text(f"❌ {data.get('error', 'Failed to unlock user account.')}")
        else:
            await update.message.reply_text(f"❌ Error: HTTP {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error unlocking user: {str(e)}")
        await update.message.reply_text("❌ An error occurred while processing your request.")


async def send_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE, text=None, image=None, caption=None, button_text=None, button_url=None):
    user_ids = await get_all_user_ids()
    total_users = len(user_ids)
    successful = 0
    failed = 0
    failed_details = []

    keyboard = None
    if button_text and button_url:
        keyboard = InlineKeyboardMarkup([[InlineKeyboardButton(button_text, url=button_url)]])

    for user_id in user_ids:
        try:
            if image:
                if text:
                    await context.bot.send_photo(chat_id=user_id, photo=image, caption=text, reply_markup=keyboard)
                else:
                    await context.bot.send_photo(chat_id=user_id, photo=image, caption=caption, reply_markup=keyboard)
            else:
                await context.bot.send_message(chat_id=user_id, text=text, reply_markup=keyboard)
            successful += 1
        except TelegramError as e:
            logger.error(f"Failed to send broadcast to user {user_id}: {str(e)}")
            failed += 1
            failed_details.append(f"User ID: {user_id}, Error: {str(e)}")

    stats_message = (
        f"📊 Broadcast Stats:\n"
        f"Total users: {total_users}\n"
        f"✅ Successful: {successful}\n"
        f"❌ Failed: {failed}\n\n"
        f"Failed Details:\n" + "\n".join(failed_details) if failed_details else "No failures"
    )
    
    await update.message.reply_text(stats_message)

async def get_ip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin command to fetch the server's outbound IP address"""
    user = update.effective_user
    
    # Check if the user is an admin
    if not await is_admin(user.id):
        await update.message.reply_text("You don't have permission to use this command.")
        return
    
    try:
        # Use multiple IP checking services for redundancy
        ip_services = [
            "https://api.ipify.org",
            "https://ifconfig.me/ip",
            "https://icanhazip.com",
            "https://ipinfo.io/ip"
        ]
        
        results = []
        for service_url in ip_services:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(service_url)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        results.append(f"✅ {service_url}: `{ip}`")
                    else:
                        results.append(f"❌ {service_url}: Failed with status {response.status_code}")
            except Exception as e:
                results.append(f"❌ {service_url}: Error - {str(e)}")
        
        # Get local IP addresses
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Format the response
        response_text = "🌐 *Server IP Information*\n\n"
        response_text += f"*Hostname:* `{hostname}`\n"
        response_text += f"*Local IP:* `{local_ip}`\n\n"
        response_text += "*External IP Checks:*\n"
        response_text += "\n".join(results)
        
        await update.message.reply_text(response_text, parse_mode="Markdown")
        
    except Exception as e:
        logger.error(f"Error fetching IP information: {str(e)}")
        await update.message.reply_text(f"❌ Error fetching IP information: {str(e)}")

import threading
import time

def ping_server_thread():
    """Ping the server every 7 minutes to keep it alive - runs in a separate thread."""
    while True:
        try:
            logger.info("Pinging server to keep alive...")
            # Use a synchronous request since we're in a separate thread
            response = httpx.get(f"{API_BASE_URL}/ping/", timeout=10.0)
            if response.status_code == 200:
                logger.info(f"Ping successful: {response.text}")
            else:
                logger.warning(f"Ping failed with status code: {response.status_code}")
        except Exception as e:
            logger.error(f"Error pinging server: {str(e)}")
        
        # Wait for 7 minutes
        time.sleep(420)  # 7 minutes = 420 seconds

def start_ping_thread():
    """Start the ping server function in a separate thread."""
    ping_thread = threading.Thread(target=ping_server_thread, daemon=True)
    ping_thread.start()
    logger.info("Started ping server thread")
    return ping_thread


def run_bot():
    
    application = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("broadcast", broadcast))
    application.add_handler(CommandHandler("unlock", unlock_user))
    application.add_handler(CommandHandler("gen", generate_codes))
    application.add_handler(CommandHandler("ip", get_ip))

    application.add_handler(MessageHandler(filters.TEXT | filters.PHOTO, handle_broadcast_content))
    
    start_ping_thread()
    
    application.run_polling()
    

if __name__ == "__main__":
    run_bot()