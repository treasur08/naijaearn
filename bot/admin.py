from django.contrib import admin
from .models import User, Channel, Task, Withdrawal, ActivationCode, Payout
from django.utils import timezone

class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'bank', 'account_number', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__first_name', 'user__telegram_id', 'bank', 'account_number')
    actions = ['approve_withdrawals']

    def approve_withdrawals(self, request, queryset):
        queryset.update(status='Successful', approved_at=timezone.now())
    approve_withdrawals.short_description = "Approve selected withdrawals"

class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'is_used', 'created_at', 'used_at', 'used_by')
    list_filter = ('is_used', 'created_at', 'used_at')
    search_fields = ('code', 'used_by__first_name', 'used_by__telegram_id')
    actions = ['generate_new_codes']

    def generate_new_codes(self, request, queryset):
        ActivationCode.generate_codes()
        self.message_user(request, "100 new activation codes have been generated.")
    generate_new_codes.short_description = "Generate 100 new activation codes"

class PayoutAdmin(admin.ModelAdmin):
    list_display = ('reference', 'withdrawal', 'amount', 'account_number', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('reference', 'withdrawal__user__first_name', 'withdrawal__user__telegram_id', 'account_number')
    readonly_fields = ('id', 'reference', 'created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('id', 'reference', 'withdrawal', 'amount', 'bank_code', 'account_number', 'account_name')
        }),
        ('Status', {
            'fields': ('status', 'narration', 'failure_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def has_add_permission(self, request):
        return False
    
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task_type', 'reward')
    list_filter = ('task_type',)
    search_fields = ('title',)
    fieldsets = (
        (None, {
            'fields': ('title', 'link', 'reward')
        }),
        ('Task Type', {
            'fields': ('task_type',),
            'description': 'Select the type of task. This will determine the icon displayed on the dashboard.'
        }),
    )
    
admin.site.register(User)
admin.site.register(Channel)
admin.site.register(Task, TaskAdmin)
admin.site.register(Withdrawal, WithdrawalAdmin)
admin.site.register(ActivationCode, ActivationCodeAdmin)
admin.site.register(Payout, PayoutAdmin)

