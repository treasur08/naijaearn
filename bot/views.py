import asyncio
from decimal import Decimal
from django.shortcuts import render, redirect
from django.http import HttpResponseServerError, JsonResponse, HttpResponse
from .models import User, Channel, Task, Withdrawal, ActivationCode, Payout, TaskCompletion
from django.db.models.functions import TruncDate
from django.db.models import Count, F
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from .telegram_bot import *
import json
import logging
from asgiref.sync import async_to_sync, sync_to_async
from django.utils import timezone
from datetime import timedelta
from django.db import models, transaction
from django.template.defaulttags import register
from telegram.error import NetworkError
from django.core.mail import send_mail
from django.utils.timezone import now
from django.template.defaulttags import register
from .services.korapay import *
from functools import wraps
import httpx

from telegram.error import NetworkError

import logging

logger = logging.getLogger(__name__)
loop = asyncio.get_event_loop()
ADMIN_IDS = list(map(int, os.getenv('ADMIN_IDS', '').split(',')))

telegram_client = httpx.AsyncClient(
    timeout=10.0,  
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20)
)

def async_safe(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return async_to_sync(f)(*args, **kwargs)
        except Exception as e:
            logger.error(f"Async error in {f.__name__}: {str(e)}")
            return None
    return wrapper

async def update_user_profile_photo_async(user_id):
    """Fetch and update the user's profile photo using direct API calls with proper async handling."""
    try:
        # Use the same pattern as get_chat_member_async which is working
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get user profile photos
            response = await client.get(
                f"https://api.telegram.org/bot{bot.token}/getUserProfilePhotos",
                params={"user_id": user_id, "limit": 1}
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("ok") or not data.get("result", {}).get("photos"):
                return None
                
            file_id = data["result"]["photos"][0][-1]["file_id"]
            
            # Get the file path
            file_response = await client.get(
                f"https://api.telegram.org/bot{bot.token}/getFile",
                params={"file_id": file_id}
            )
            file_response.raise_for_status()
            file_data = file_response.json()
            
            if not file_data.get("ok"):
                return None
                
            file_path = file_data["result"]["file_path"]
            
            profile_photo_url = f"https://api.telegram.org/file/bot{bot.token}/{file_path}"
            
            user = await sync_to_async(User.objects.get)(telegram_id=user_id)
            
            if user.profile_photo_url != profile_photo_url:
                user.profile_photo_url = profile_photo_url
                await sync_to_async(user.save)()
                logger.info(f"Updated profile photo for user {user_id}")
            
            return profile_photo_url
    except httpx.HTTPError as e:
        logger.error(f"HTTP error updating profile photo: {str(e)}")
    except Exception as e:
        logger.error(f"Error updating profile photo: {str(e)}")
    
    return None


def custom_error_view(request, exception=None):
    return render(request, 'error.html', status=500)

@async_safe
async def update_user_profile_photo(user_id):
    return await update_user_profile_photo_async(user_id)

def ping(request):
    start_time = now()
    response = HttpResponse("PONG")
    end_time = now()
    response_time = (end_time - start_time).total_seconds() * 1000
    response.content = f"PONG {response_time:.2f}ms"
    return response


def index(request):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return render(request, 'error.html')
            
        user = User.objects.get(telegram_id=user_id)
        channels = Channel.objects.all()
        tasks = Task.objects.all()

        
        
        channel_data = []
        for channel in channels:
            channel_data.append({
                'id': channel.id,
                'name': channel.name,
                'url': channel.url,
                'is_joined': user.joined_channels.filter(id=channel.id).exists()
            })

        earnings = []
        
        for channel in user.joined_channels.all():
            earnings.append({
                'type': 'channel',
                'title': f'Joined {channel.name}',
                'amount': 100.00,
                'date': user.joined_channels.through.objects.filter(user=user, channel=channel).first().created_at
            })
        
        for referral in user.referrals.filter(referrer_rewarded=True):
            earnings.append({
                'type': 'referral',
                'title': f'Referred {referral.first_name}',
                'amount': 500.00,
                'date': getattr(referral, 'created_at', timezone.now())
            })
        
        task_completions = TaskCompletion.objects.filter(user=user)
        for completion in task_completions:
            # If the task still exists, use its data
            if completion.task:
                title = completion.task.title
                amount = completion.task.reward
            # If the task was deleted but we saved its info in TaskCompletion
            elif completion.task_title:
                title = completion.task_title
                amount = completion.task_reward
            else:
                # Skip if we don't have any task information
                continue
                
            earnings.append({
                'type': 'task',
                'title': title,
                'amount': amount,
                'date': completion.created_at
            })
        
        # Sort earnings by date, newest first
        earnings.sort(key=lambda x: x['date'], reverse=True)

        context = {
            'user': user,
            "tasks": tasks,
            'channels': channel_data,
            'earnings': earnings[:10],
        }
        return render(request, 'index.html', context)
    except User.DoesNotExist:
        print(f"User with telegram_id {user_id} not found")
        return render(request, 'error.html')
    except Exception as e:
        print(f"Error in index view: {str(e)}")
        return render(request, 'error.html')

def refer(request):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return render(request, 'error.html')
            
        user = User.objects.get(telegram_id=user_id)
        referrals = user.referrals.all()
        ref_count = referrals.count()
        ref_earning = user.referral_bonus

        today = timezone.now().date()
        today_referrals = user.referrals.filter(created_at__date=today).count()
        
        
        all_channels_joined = user.check_all_channels_joined()
        top_users = User.objects.annotate(
            ref_count=models.Count('referrals')
        ).order_by('-ref_count', '-referral_bonus')
        
        # Get user's rank
        user_rank = list(top_users.values_list('telegram_id', flat=True)).index(user.telegram_id) + 1

        context = {
            'user': user,
            'ref_count': ref_count,
            'ref_earning': ref_earning,
            'channels_joined': all_channels_joined,
            'bot_username': BOT_USERNAME,
            'referrals': referrals[:5],  
            'total_referrals': ref_count,
            'top_users': top_users[:50],  
            'user_rank': user_rank,
            'today_referrals': today_referrals, 
        }
        return render(request, 'refer.html', context)
    except User.DoesNotExist:
        print(f"User with telegram_id {user_id} not found")
        return render(request, 'error.html')
    except Exception as e:
        print(f"Error in refer view: {str(e)}")
        return render(request, 'error.html')


@csrf_exempt
def withdraw(request):
    if request.method == 'GET':
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return render(request, 'error.html', {'error_message': 'User ID is missing'})
            
            user = User.objects.get(telegram_id=user_id)
            withdrawals = Withdrawal.objects.filter(user=user).order_by('-created_at')
            context = {
                'user': user,
                'withdrawals': withdrawals,
            }
            return render(request, 'withdraw.html', context)
        except User.DoesNotExist:
            return render(request, 'error.html', {'error_message': 'User not found'})
        except Exception as e:
            logger.error(f"Error in withdraw view: {str(e)}")
            return render(request, 'error.html', {'error_message': 'An unexpected error occurred'})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            amount = Decimal(data.get('amount'))  # Convert to Decimal
            bank = data.get('bank')
            account_number = data.get('accountNumber')

            user = User.objects.get(telegram_id=user_id)

            if amount < Decimal('600'):
                return JsonResponse({'success': False, 'error': 'Minimum withdrawal amount is ₦600'})

            if user.balance < amount:
                return JsonResponse({'success': False, 'error': 'Insufficient balance'})

            if len(account_number) != 10:
                return JsonResponse({'success': False, 'error': 'Account number must be 10 digits'})

            withdrawal = Withdrawal.objects.create(
                user=user,
                amount=amount,
                bank=bank,
                account_number=account_number
            )

            user.balance -= amount
            user.save()

            
            return JsonResponse({
                'success': True,
                'message': f'Your withdrawal request of NGN{amount:.2f} has been submitted',
                'new_balance': float(user.balance)
            })
        except ValueError as e:
            logger.error(f"Error processing withdrawal: Invalid amount - {str(e)}")
            return JsonResponse({'success': False, 'error': 'Invalid withdrawal amount'})
        except Exception as e:
            logger.error(f"Error processing withdrawal: {str(e)}")
            return JsonResponse({'success': False, 'error': 'An error occurred while processing your request'})
    
def ads(request):
    """View for the advertising page."""
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return render(request, 'error.html', {'error_message': 'User ID is missing'})
            
        user = User.objects.get(telegram_id=user_id)
        
        context = {
            'user': user,
            'bot_username': BOT_USERNAME,
        }
        return render(request, 'ads.html', context)
    except User.DoesNotExist:
        print(f"User with telegram_id {user_id} not found")
        return render(request, 'error.html', {'error_message': 'User not found'})
    except Exception as e:
        print(f"Error in ads view: {str(e)}")
        return render(request, 'error.html', {'error_message': 'An unexpected error occurred'})



@csrf_exempt
@require_POST
def check_joined(request, channel_id):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User ID is missing'}, status=400)

        user = User.objects.get(telegram_id=user_id)
        channel = Channel.objects.get(id=channel_id)

        chat_id = channel.url.split('/')[-1]
        chat_identifier = chat_id if chat_id.startswith('+') else f"@{channel.username}"

        chat_status = asyncio.run(get_chat_member_async(chat_identifier, int(user_id)))

        if chat_status in ['member', 'administrator', 'creator']:
            # Save to database using dynamic field
            user.task_balance = F('task_balance') + Decimal('20.00')
            user.save(update_fields=['task_balance'])
            
            # Refresh from database to get updated values
            user.refresh_from_db()
            
            # Update total balance
            user.update_total_balance()
            user.joined_channels.add(channel)
            all_joined = user.check_all_channels_joined()

            return JsonResponse({
                'success': True,
                'is_member': True,
                'all_joined': all_joined,
                'new_balance': float(user.balance),
                'task_balance': float(user.task_balance),
                'message': 'Channel joined successfully!, Earned NGN 20 ✅' if not all_joined else 'Congratulations! You have joined all channels! 🎉'
            })
        return JsonResponse({
            'success': True,
            'is_member': False,
            'all_joined': False,
            'message': 'Please join the channel first'
        })

    except Exception as e:
        logger.error(f"Error in check_joined view: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

# Function to run async functions inside the global event loop
def run_in_loop(async_func, *args, **kwargs):
    return asyncio.run_coroutine_threadsafe(async_func(*args, **kwargs), loop).result()

@register.filter
def getattr_dynamic(obj, attr):
    """Custom template filter to dynamically check channel join status"""
    return getattr(obj, f'joined_channel_{attr}', False)

async def get_chat_member_async(chat_id, user_id, retries=3):
    """Checks if a user is a member of a Telegram channel, with retries."""
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://api.telegram.org/bot{bot.token}/getChatMember",
                                            params={"chat_id": chat_id, "user_id": user_id})
                response.raise_for_status()  
                data = response.json()

                if data.get("ok"):  
                    return data["result"]["status"]  # Extract user status

                raise ValueError("Unexpected API response format")

        except (httpx.HTTPStatusError, ValueError, NetworkError) as e:
            if attempt < retries - 1:
                await asyncio.sleep(2)  # Wait before retrying
            else:
                raise e

@csrf_exempt
@require_POST
def start_task(request, task_id):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User ID is missing'}, status=400)

        user = User.objects.get(telegram_id=user_id)
        task = Task.objects.get(id=task_id)

        # Store the start time in the session
        request.session[f'task_{task_id}_start_time'] = timezone.now().isoformat()

        return JsonResponse({'success': True})
    except Exception as e:
        logger.error(f"Error in start_task view: {e}")
        return JsonResponse({'success': False, 'error': 'Failed to start task'}, status=500)

@csrf_exempt
@require_POST
def complete_task(request, task_id):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User ID is missing'}, status=400)

        user = User.objects.get(telegram_id=user_id)
        task = Task.objects.get(id=task_id)

        start_time_str = request.session.get(f'task_{task_id}_start_time')
        if not start_time_str:
            return JsonResponse({'success': False, 'error': 'Task not started'}, status=400)

        start_time = timezone.datetime.fromisoformat(start_time_str)
        time_spent = timezone.now() - start_time

        if time_spent < timedelta(seconds=20):
            return JsonResponse({'success': False, 'error': 'Please do the task ❌'}, status=400)

        user.task_balance += task.reward
        user.completed_tasks.add(task)
        user.update_total_balance()
        user.save()

        task_completion, created = TaskCompletion.objects.get_or_create(
            user=user,
            task=task,
            defaults={
                'task_title': task.title,
                'task_reward': task.reward
            }
        )
        
        
        if not created:
            task_completion.task_title = task.title
            task_completion.task_reward = task.reward
            task_completion.save()

        del request.session[f'task_{task_id}_start_time']

        return JsonResponse({'success': True, 'message': 'Task completed successfully!', 'new_balance': float(user.balance)})
    except Exception as e:
        logger.error(f"Error in complete_task view: {e}")
        return JsonResponse({'success': False, 'error': 'Failed to complete task'}, status=500)

@csrf_exempt
@require_POST
def approve_withdrawal(request, withdrawal_id):
    try:
        withdrawal = Withdrawal.objects.get(id=withdrawal_id)
        withdrawal.status = 'Successful'
        withdrawal.approved_at = timezone.now()
        withdrawal.save()
        return JsonResponse({'success': True, 'message': 'Withdrawal approved successfully'})
    except Withdrawal.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Withdrawal not found'}, status=404)
    except Exception as e:
        logger.error(f"Error approving withdrawal: {str(e)}")
        return JsonResponse({'success': False, 'error': 'An error occurred while approving the withdrawal'}, status=500)
    
def activate(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        loading = request.GET.get('loading', 'true')
        if not user_id:
            return render(request, 'error.html', {'error_message': 'User ID is missing'})
        
        try:
            if loading == 'true':
                return render(request, 'load.html')
            user = User.objects.get(telegram_id=user_id)
            if user.is_activated:
                try:
                    update_user_profile_photo(int(user_id))
                except Exception as e:
                    logger.error(f"Failed to update profile photo: {str(e)}")
                if not user.pin_set:
                    return redirect(f'/set-pin/?user_id={user_id}')
                # If user is activated and has a PIN, redirect to PIN login
                return redirect(f'/pin-login/?user_id={user_id}&redirect_url=/?user_id={user_id}')
                
            context = {
                'user': user,
                'bot_username': BOT_USERNAME,
                }
            return render(request, 'activate.html', context)
            
        except User.DoesNotExist:
            return render(request, 'error.html', {'error_message': 'User not found'})
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        activation_key = data.get('activation_key')

        try:
            user = User.objects.get(telegram_id=user_id)
            if user.is_activated:
                return JsonResponse({'success': False, 'error': 'User is already activated'})
            
            if ActivationCode.objects.filter(code=activation_key, is_used=True).exists():
                return JsonResponse({'success': False, 'error': 'This activation code has already been used'})

            activation_code = ActivationCode.objects.filter(code=activation_key, is_used=False).first()
            if activation_code:
                activation_code.use(user)
                user.is_activated = True
                user.save()

                if user.referrer and not user.referrer_rewarded:
                    referrer = user.referrer
                    referrer.affiliate_balance += Decimal('500.00')
                    referrer.referral_bonus += 500
                    referrer.save()
                    
                    referrer.update_total_balance()

                    user.referrer_rewarded = True 
                    user.save()
                return JsonResponse({
                    'success': True, 
                    'message': 'Account activated successfully',
                    'redirect_url': f'/set-pin/?user_id={user_id}'  
                })
            else:
                return JsonResponse({'success': False, 'error': 'Invalid activation code'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})
        except Exception as e:
            logger.error(f"Error in activate view: {str(e)}")
            return JsonResponse({'success': False, 'error': 'An error occurred while activating the account'})

def get_key(request):
    user_id = request.GET.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'User ID is missing'}, status=400)

    try:
        user = User.objects.get(telegram_id=user_id)
        if user.is_activated:
            return JsonResponse({'error': 'User is already activated'}, status=400)

        # Generate a new activation code
        new_code = ActivationCode.objects.filter(is_used=False).first()
        if not new_code:
            ActivationCode.generate_codes()
            new_code = ActivationCode.objects.filter(is_used=False).first()

        if new_code:
            return JsonResponse({'key': new_code.code})
        else:
            return JsonResponse({'error': 'Unable to generate activation key'}, status=500)

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error in get_key view: {str(e)}")
        return JsonResponse({'error': 'An unexpected error occurred'}, status=500)

@csrf_exempt
@require_POST
def create_or_get_user(request):
    data = json.loads(request.body)
    telegram_id = data.get('telegram_id')
    first_name = data.get('first_name')
    profile_photo_url = data.get('profile_photo_url')

    user, created = User.objects.get_or_create(
        telegram_id=telegram_id,
        defaults={
            'first_name': first_name,
            'profile_photo_url': profile_photo_url,
            'balance': 10.00  # Default balance
        }
    )

    return JsonResponse({
        'success': True,
        'created': created,
        'user': {
            'telegram_id': user.telegram_id,
            'first_name': user.first_name,
            'balance': float(user.balance),
            'is_activated': user.is_activated
        }
    })

@csrf_exempt
@require_POST
def handle_referral(request):
    data = json.loads(request.body)
    referrer_id = data.get('referrer_id')
    user_id = data.get('user_id')

    try:
        user = User.objects.get(telegram_id=user_id)
        referrer = User.objects.get(telegram_id=referrer_id)

        if user.referrer is None and referrer != user:
            user.referrer = referrer
            user.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'User already has a referrer or invalid referral'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User or referrer not found'})


@require_GET
def get_all_channels(request):
    channels = Channel.objects.all()
    channel_list = [{
        'id': channel.id,
        'name': channel.name,
        'username': channel.username,
        'url': channel.url
    } for channel in channels]
    return JsonResponse({'success': True, 'channels': channel_list})

@require_GET
def get_all_user_ids(request):
    user_ids = list(User.objects.values_list('telegram_id', flat=True))
    return JsonResponse({'success': True, 'user_ids': user_ids})

@require_GET
def check_admin(request, user_id):
    """Check if a user is an admin."""
    try:
        # Add debugging
        admin_ids = list(map(int, os.getenv('ADMIN_IDS', '').split(',')))
        print(f"Checking if {user_id} is in admin list: {admin_ids}")
        
        is_admin = int(user_id) in admin_ids
        return JsonResponse({'success': True, 'is_admin': is_admin})
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Invalid user_id'}, status=400)


@sync_to_async
@transaction.atomic
def reward_referrer(user_id):
    user = User.objects.get(telegram_id=user_id)
    if user.referrer and not user.referrer_rewarded and user.is_activated:
        referrer = user.referrer
        referrer.balance += 400
        referrer.referral_bonus += 400
        referrer.save()
        user.referrer_rewarded = True
        user.save()
        return True
    return False


@csrf_exempt
async def verify_account(request):
    """Verify bank account details."""
    try:
        data = json.loads(request.body)
        bank_code = data.get('bank_code')
        account_number = data.get('account_number')

        if not all([bank_code, account_number]):
            return JsonResponse({
                'success': False,
                'error': 'Bank code and account number are required'
            }, status=400)

        korapay = KorapayService()
        result = await korapay.resolve_bank_account(bank_code, account_number)

        print("Account Verification Result:", result)  # Add this line
        
        if result.get('status'):
            return JsonResponse({
                'success': True,
                'data': result['data']
            })
        else:
            return JsonResponse({
                'success': False,
                'error': result.get('message', 'Failed to verify account')
            }, status=400)

    except Exception as e:
        logger.error(f"Error verifying account: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while verifying the account'
        }, status=500)

@csrf_exempt
async def process_withdrawal(request):
    """Process withdrawal and initiate payout."""
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        amount = Decimal(data.get('amount'))
        bank_name = data.get('bank')
        account_number = data.get('account_number')
        account_name = data.get('account_name')
        email = data.get('email')
        balance_type = data.get('balance_type', 'affiliate')

        # Validate inputs
        if not all([user_id, amount, bank_name, account_number, account_name]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)

        user = await sync_to_async(User.objects.get)(telegram_id=user_id)

        # Validate amount
        if amount < Decimal('800') and balance_type == 'affiliate':
            return JsonResponse({
                'success': False,
                'error': 'Minimum withdrawal amount is ₦800'
            })
        if amount < Decimal('400') and balance_type == 'task':
            return JsonResponse({
                'success': False,
                'error': 'Minimum withdrawal amount is ₦400'
            })

        if balance_type == 'affiliate':
            if user.affiliate_balance < amount:
                return JsonResponse({
                    'success': False,
                    'error': 'Insufficient affiliate balance'
                })
        else:  # task balance
            if user.task_balance < amount:
                return JsonResponse({
                    'success': False,
                    'error': 'Insufficient task balance'
                })


        bank_code = None
        try:
            # Load bank codes from the file
            with open('bot/banks.json', 'r') as f:
                bank_data = json.load(f)
                
                for bank in bank_data:
                    if bank_name.lower() in bank['name'].lower() or bank['name'].lower() in bank_name.lower():
                        bank_code = bank['code']
                        logger.info(f"Found bank code {bank_code} for bank name: {bank_name}")
                        break


                
                if not bank_code:
                    logger.error(f"Bank code not found for bank name: {bank_name}")
                    return JsonResponse({
                        'success': False,
                        'error': 'Selected bank is not supported'
                    }, status=400)
        except Exception as e:
            logger.error(f"Error loading bank codes: {str(e)}", exc_info=True)
            return JsonResponse({
                'success': False,
                'error': 'Error processing bank information'
            }, status=500)

        # Create withdrawal record
        withdrawal = await sync_to_async(Withdrawal.objects.create)(
            user=user,
            amount=amount,
            bank_code=bank_code,
            bank=bank_name,  # Store the bank name
            account_number=account_number,
            account_name=account_name,
            status='Processing',
            balance_type=balance_type
        )

        # Initiate payout using GTRPay
        from .services.gtrpay import GTRPayService
        gtrpay = GTRPayService()
        payout = await gtrpay.initiate_payout(withdrawal, email)

        if not payout:
            logger.error(f"Payout failed for withdrawal {withdrawal.id} - User: {user.telegram_id}, Amount: {amount}")
            await sync_to_async(withdrawal.delete)()
            return JsonResponse({
                'success': False,
                'error': 'Payment processing failed. Please try again in a few minutes.'
            }, status=400)

        if balance_type == 'affiliate':
                user.affiliate_balance -= amount
        else:  # task balance
            user.task_balance -= amount
                
            # Update total balance
        await sync_to_async(user.update_total_balance)()
        await sync_to_async(user.save)()

        return JsonResponse({
            'success': True,
            'message': 'Withdrawal initiated successfully',
            'new_balance': float(user.balance),
            'reference': payout.reference
        })

    except Exception as e:
        logger.error(f"Withdrawal processing error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Payment processing is currently unavailable. Please try again later.'
        }, status=500)


@csrf_exempt
async def webhook(request):
    try:
        data = json.loads(request.body)
        logger.info(f"Received GTRPay webhook: {json.dumps(data, indent=2)}")
        
        # Extract relevant information
        order_no = data.get('orderNo')
        trade_no = data.get('tradeNo')
        pay_status = data.get('payStatus')  # Changed from 'status' to 'payStatus'
        real_amount = data.get('realAmount')  # Actual amount paid
        
        # Verify the signature
        received_sign = data.get('sign')
        # Create a copy of data without the sign field for verification
        verification_data = {k: v for k, v in data.items() if k != 'sign'}
        
        # Initialize GTRPay service to use its signature generation
        from .services.gtrpay import GTRPayService
        gtrpay_service = GTRPayService()
        calculated_sign = gtrpay_service.generate_signature(verification_data)
        
        # Verify signature but continue processing regardless
        if received_sign != calculated_sign:
            logger.warning(f"Signature mismatch in GTRPay webhook. Received: {received_sign}, Calculated: {calculated_sign}")
            # Continue processing despite signature mismatch
        
        # Find the payout by reference
        payout = await sync_to_async(Payout.objects.filter(reference=order_no).first)()
        
        if not payout:
            logger.error(f"Payout not found for reference: {order_no}")
            return JsonResponse({'code': 200, 'msg': 'success'})  # Always return success to GTRPay
        
        
        if pay_status == 1:  # Payment successful
            payout.status = 'successful'
            payout.provider_reference = trade_no
            await sync_to_async(payout.save)()
            
            # Update withdrawal status
            withdrawal = payout.withdrawal
            withdrawal.status = 'Successful'
            withdrawal.approved_at = timezone.now()
            await sync_to_async(withdrawal.save)()
            
          
            
        elif pay_status == 2:  # Payment failed
            payout.status = 'failed'
            payout.failure_reason = data.get('remark', 'Unknown reason')
            await sync_to_async(payout.save)()
            
            # Update withdrawal status
            withdrawal = payout.withdrawal
            withdrawal.status = 'Failed'
            await sync_to_async(withdrawal.save)()
            
            # Refund user
            user = withdrawal.user
            user.balance += withdrawal.amount
            await sync_to_async(user.save)()
            
           
        
        return JsonResponse({'code': 200, 'msg': 'success'})
        
    except Exception as e:
        logger.error(f"Error processing GTRPay webhook: {str(e)}", exc_info=True)
        return JsonResponse({'code': 200, 'msg': 'success'})  # Always return success to GTRPay


def set_pin(request):
    user_id = request.GET.get('user_id')
    if not user_id:
        return render(request, 'error.html', {'error_message': 'User ID is missing'})
    
    try:
        user = User.objects.get(telegram_id=user_id)
        context = {
            'user': user,
        }
        return render(request, 'pin_setup.html', context)
    except User.DoesNotExist:
        return render(request, 'error.html', {'error_message': 'User not found'})

def pin_login(request):
    user_id = request.GET.get('user_id')
    redirect_url = request.GET.get('redirect_url', f'/?user_id={user_id}')
    
    if not user_id:
        return render(request, 'error.html', {'error_message': 'User ID is missing'})
    
    try:
        user = User.objects.get(telegram_id=user_id)
        if not user.pin_set:
            return redirect(f'/set-pin/?user_id={user_id}')
            
        context = {
            'user': user,
            'redirect_url': redirect_url,
            'bot_username': BOT_USERNAME,
        }
        return render(request, 'pin_login.html', context)
    except User.DoesNotExist:
        return render(request, 'error.html', {'error_message': 'User not found'})

@csrf_exempt
@require_POST
def verify_pin(request):
    data = json.loads(request.body)
    user_id = data.get('user_id')
    pin = data.get('pin')
    
    try:
        user = User.objects.get(telegram_id=user_id)
        
        # Check if account is locked
        if user.failed_pin_attempts >= 3 and user.last_pin_attempt:
            lockout_time = timezone.now() - user.last_pin_attempt
            if lockout_time.total_seconds() < 1200:  # 20 mins lockout
                return JsonResponse({
                    'success': False, 
                    'error': 'Account is locked. Please try again later or contact support.'
                })
        
        if user.verify_pin(pin):
            return JsonResponse({'success': True})
        else:
            return JsonResponse({
                'success': False,
                'error': 'Incorrect PIN',
                'attempts_left': 3 - user.failed_pin_attempts
            })
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'})

@csrf_exempt
@require_POST
def set_pin_api(request):
    """API endpoint to process PIN submission"""
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        pin = data.get('pin')
        
        if not user_id or not pin:
            return JsonResponse({'success': False, 'error': 'User ID and PIN are required'}, status=400)
            
        if len(pin) != 6 or not pin.isdigit():
            return JsonResponse({'success': False, 'error': 'PIN must be 6 digits'}, status=400)
            
        # Check for weak PINs
        if pin in ['123456', '654321', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '000000']:
            return JsonResponse({'success': False, 'error': 'Please choose a stronger PIN'}, status=400)
        
        user = User.objects.get(telegram_id=user_id)
        
        # Call the set_pin method from the User model
        success = user.set_pin(pin)
        
        if success:
            return JsonResponse({'success': True, 'message': 'PIN set successfully'})
        else:
            return JsonResponse({'success': False, 'error': 'Failed to set PIN'}, status=500)
            
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error setting PIN: {str(e)}")
        return JsonResponse({'success': False, 'error': 'An error occurred while setting the PIN'}, status=500)

@csrf_exempt
@require_POST
def admin_unlock_user(request, user_id):
    """API endpoint for admins to unlock a user account"""
    try:
        data = json.loads(request.body)
        admin_id = data.get('admin_id')
        
        # Verify admin permissions
        if not admin_id or int(admin_id) not in ADMIN_IDS:
            return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)
        
        # Get the user
        user = User.objects.get(telegram_id=user_id)
        
        # Reset failed attempts
        user.failed_pin_attempts = 0
        user.save()
        
        logger.info(f"Admin {admin_id} unlocked account for user {user_id}")
        
        return JsonResponse({
            'success': True,
            'message': f"Account unlocked for {user.first_name} (ID: {user_id})"
        })
        
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error unlocking user: {str(e)}")
        return JsonResponse({'success': False, 'error': 'An error occurred'}, status=500)


@csrf_exempt
def change_pin(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        current_pin = data.get('current_pin')
        new_pin = data.get('new_pin')
        
        try:
            user = User.objects.get(telegram_id=user_id)
            
            # Verify current PIN
            if not user.verify_pin(current_pin):
                return JsonResponse({
                    'success': False,
                    'error': 'Current PIN is incorrect'
                })
            
            # Set new PIN
            user.set_pin(new_pin)
            
            return JsonResponse({
                'success': True,
                'message': 'PIN changed successfully'
            })
            
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'User not found'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    })

@csrf_exempt
@require_POST
def admin_generate_codes(request):
    """API endpoint for admins to generate activation codes"""
    try:
        data = json.loads(request.body)
        admin_id = data.get('admin_id')
        count = data.get('count', 100)  # Default to 100 if not specified
        
        # Verify admin permissions
        if not admin_id or int(admin_id) not in ADMIN_IDS:
            return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)
        
        # Generate codes
        existing_count = ActivationCode.objects.filter(is_used=False).count()
        
        # Generate new codes
        ActivationCode.generate_codes(count=count)
        
        # Get the newly generated codes
        new_codes = ActivationCode.objects.filter(is_used=False).order_by('-created_at')[:count]
        code_list = [code.code for code in new_codes]
        
        logger.info(f"Admin {admin_id} generated {count} activation codes")
        
        return JsonResponse({
            'success': True,
            'message': f"Generated {count} activation codes",
            'codes': code_list,
            'total_unused': existing_count + count
        })
        
    except Exception as e:
        logger.error(f"Error generating codes: {str(e)}")
        return JsonResponse({'success': False, 'error': 'An error occurred'}, status=500)

@require_GET
def get_referral_analytics(request):
    """Get referral analytics data for the last 10 days."""
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User ID is missing'}, status=400)
            
        user = User.objects.get(telegram_id=user_id)
        
        # Get the date 10 days ago
        ten_days_ago = timezone.now() - timezone.timedelta(days=10)
        
        # Get all referrals associated with the user
        referrals = User.objects.filter(
            referrer=user,
            # Include all referrals, not just rewarded ones
        )
        
        # Debug info
        logger.info(f"Found {referrals.count()} total referrals for user {user_id}")
        
        # Create a dictionary to track daily referral counts
        dates_dict = {}
        
        # Initialize all dates in the past 10 days with 0 referrals
        current_date = ten_days_ago.date()
        today = timezone.now().date()
        
        while current_date <= today:
            date_str = current_date.strftime('%b %d')  # Format: 'Jan 01'
            dates_dict[date_str] = 0
            current_date += timezone.timedelta(days=1)
        
        # Count referrals by date
        for referral in referrals:
            # Try to get the date the referral was created
            referral_date = None
            
            # Check for created_at field first
            if hasattr(referral, 'created_at') and referral.created_at:
                referral_date = referral.created_at.date()
           
            # If we couldn't determine the date, use the current date
            if not referral_date:
                logger.warning(f"Could not determine date for referral {referral.id}, using today's date")
                referral_date = today
            
            # Only count if within the last 10 days
            if referral_date >= ten_days_ago.date():
                date_str = referral_date.strftime('%b %d')
                dates_dict[date_str] = dates_dict.get(date_str, 0) + 1
                logger.info(f"Counted referral for date {date_str}")
        
        # Create ordered lists for dates and counts
        dates = list(dates_dict.keys())
        counts = list(dates_dict.values())
        
        # Calculate trend (comparing first 5 days with last 5 days)
        first_half = sum(counts[:5])
        second_half = sum(counts[5:])
        
        trend_percentage = 0
        if first_half > 0:
            trend_percentage = round(((second_half - first_half) / first_half) * 100)
        elif second_half > 0:
            trend_percentage = 100  # If starting from zero, it's a 100% increase
        
        # Calculate daily average
        total_referrals = sum(counts)
        daily_average = round(total_referrals / len(counts), 1) if counts else 0
        
        # Get total referral count (all time)
        all_time_referrals = referrals.count()
        
        # Debug the final data
        logger.info(f"Dates: {dates}")
        logger.info(f"Counts: {counts}")
        logger.info(f"Total referrals: {all_time_referrals}")
        logger.info(f"Today's referrals: {dates_dict.get(today.strftime('%b %d'), 0)}")
        
        return JsonResponse({
            'success': True,
            'data': {
                'dates': dates,
                'counts': counts,
                'total_referrals': all_time_referrals,
                'daily_average': daily_average,
                'trend_percentage': trend_percentage,
                'today_referrals': dates_dict.get(today.strftime('%b %d'), 0)
            }
        })
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found")
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error getting referral analytics: {str(e)}")
        return JsonResponse({'success': False, 'error': 'An error occurred'}, status=500)
