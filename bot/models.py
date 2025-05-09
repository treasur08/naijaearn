from django.db import models
from django.utils import timezone
from django.urls import reverse
import random
import string
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
import uuid
import hashlib

class Channel(models.Model):
    name = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    url = models.URLField()

    def __str__(self):
        return self.name

class Task(models.Model):
    TASK_TYPE_CHOICES = (
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('youtube', 'YouTube'),
        ('google', 'Google'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('other', 'Other'),
    )
    
    title = models.CharField(max_length=200)    
    link = models.URLField()
    reward = models.DecimalField(max_digits=10, decimal_places=2, default=20.00)
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='other')

    def __str__(self):
        return self.title

class User(models.Model):
    telegram_id = models.BigIntegerField(unique=True)
    first_name = models.CharField(max_length=200, default='Unknown')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    affiliate_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    task_balance = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    referrer = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')
    profile_photo_url = models.URLField(null=True, blank=True)
    referral_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    referrer_rewarded = models.BooleanField(default=False)
    is_subscribed = models.BooleanField(default=False)
    is_activated = models.BooleanField(default=False)
    pin_hash = models.CharField(max_length=200,null=True, blank=True)
    pin_set = models.BooleanField(default=False)
    failed_pin_attempts = models.IntegerField(default=0)
    last_pin_attempt = models.DateTimeField(null=True, blank=True)
    joined_channels = models.ManyToManyField('Channel', through='ChannelJoin', blank=True, related_name='subscribed_users')
    completed_tasks = models.ManyToManyField('Task', through='TaskCompletion', blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.first_name} ({self.telegram_id})"

    def check_all_channels_joined(self):
        return self.joined_channels.count() == Channel.objects.count()
    
    def update_total_balance(self):
        self.balance = self.affiliate_balance + self.task_balance
        self.save(update_fields=['balance'])
        return self.balance
    
    def set_pin(self, pin):
        """Set the user's PIN by storing a salted hash"""
        salt = uuid.uuid4().hex
        hashed_pin = self._hash_pin(pin, salt)
        self.pin_hash = f"{salt}${hashed_pin}"
        self.pin_set = True
        self.save()
        return True
    
    def verify_pin(self, pin):
        """Verify if the provided PIN matches the stored hash"""
        if not self.pin_hash:
            return False
        
        salt, stored_hash = self.pin_hash.split('$')
        calculated_hash = self._hash_pin(pin, salt)
        
        self.last_pin_attempt = timezone.now()
        
        if calculated_hash == stored_hash:
            self.failed_pin_attempts = 0
            self.save()
            return True
        else:
            self.failed_pin_attempts += 1
            self.save()
            return False
    
    def _hash_pin(self, pin, salt):
        """Create a hash of the PIN with the given salt"""
        return hashlib.sha512((pin + salt).encode('utf-8')).hexdigest()
    
    def unlock_account(self):
        """Reset failed PIN attempts to unlock the account"""
        self.failed_pin_attempts = 0
        self.save()
        return True


# Add these models after the existing models

class ChannelJoin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'channel')

   

class TaskCompletion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True)
    
    task_title = models.CharField(max_length=200, null=True, blank=True)
    task_reward = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'task')

   
class Withdrawal(models.Model):
    BALANCE_TYPE_CHOICES = (
        ('affiliate', 'Affiliate Balance'),
        ('task', 'Task Balance'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    bank = models.CharField(max_length=100)
    bank_code = models.CharField(max_length=20, default='')
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='Pending')
    balance_type = models.CharField(max_length=20, choices=BALANCE_TYPE_CHOICES, default='affiliate')
    created_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.first_name} - NGN{self.amount} - {self.status}"

    def get_admin_url(self):
        return reverse('admin:bot_withdrawal_change', args=[self.id])

class ActivationCode(models.Model):
    code = models.CharField(max_length=6, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    @classmethod
    def generate_codes(cls, count=100):
        existing_codes = set(cls.objects.values_list('code', flat=True))
        new_codes = []
        while len(new_codes) < count:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in existing_codes:
                new_codes.append(cls(code=code))
                existing_codes.add(code)
        cls.objects.bulk_create(new_codes)

    def use(self, user):
        self.is_used = True
        self.used_at = timezone.now()
        self.used_by = user
        self.save()

    def __str__(self):
        return f"{self.code} ({'Used' if self.is_used else 'Unused'})"

@receiver(post_migrate)
def create_initial_channels(sender, **kwargs):
    if sender.name == 'bot':
        Channel.objects.get_or_create(name="Mine Game", username="minegamegrp", url="https://t.me/minegamegrp")
        Channel.objects.get_or_create(name="Channel 2", username="minerockng", url="https://t.me/minerockng")


class Payout(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    withdrawal = models.OneToOneField('Withdrawal', on_delete=models.CASCADE, related_name='payout')
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    bank_code = models.CharField(max_length=10)
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    narration = models.CharField(max_length=100, blank=True)
    failure_reason = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.reference} - {self.amount} - {self.status}"

    class Meta:
        ordering = ['-created_at']