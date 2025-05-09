from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('refer/', views.refer, name='refer'),
    path('withdraw/', views.withdraw, name='withdraw'),
    path('activate/', views.activate, name='activate'),
    path('get_key/', views.get_key, name='get_key'),
    path('ping/', views.ping, name='ping'),
    path('ads/', views.ads, name='ads'),
    path('check_joined/<str:channel_id>/', views.check_joined, name='check_joined'),
    path('start_task/<int:task_id>/', views.start_task, name='start_task'),
    path('complete_task/<int:task_id>/', views.complete_task, name='complete_task'),
    path('api/admin/generate-codes/', views.admin_generate_codes, name='admin_generate_codes'),
    path('api/referral-analytics/', views.get_referral_analytics, name='api_referral_analytics'),
   
    
    path('api/user/create/', views.create_or_get_user, name='api_create_user'),
    path('referral/handle/', views.handle_referral, name='api_handle_referral'),
    path('channels/', views.get_all_channels, name='api_get_channels'),
    path('users/', views.get_all_user_ids, name='api_get_users'),
    path('api/admin/check/<int:user_id>/', views.check_admin, name='api_check_admin'),
    path('api/verify-account/', views.verify_account, name='verify_account'),
    path('api/process-withdrawal/', views.process_withdrawal, name='process_withdrawal'),
    path('api/webhook/gtrpay/', views.webhook, name='gtrpay_webhook'),

    #pins
    path('set-pin/', views.set_pin, name='set_pin'),
    path('api/set-pin/', views.set_pin_api, name='api_set_pin'),
    path('pin-login/', views.pin_login, name='pin_login'),
    path('verify-pin/', views.verify_pin, name='verify_pin'),
    path('api/admin/unlock-user/<str:user_id>/', views.admin_unlock_user, name='admin_unlock_user'),
    path('change-pin/', views.change_pin, name='change_pin'),


   
]