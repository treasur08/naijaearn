import os
import httpx
import json
from decimal import Decimal
from typing import Dict, Optional
from django.conf import settings
from ..models import Withdrawal, Payout
import uuid
from asgiref.sync import sync_to_async

class KorapayService:
    def __init__(self):
        self.base_url = "https://api.korapay.com/merchant"
        self.api_key = settings.KORAPAY_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def resolve_bank_account(self, bank_code: str, account_number: str) -> Dict:
        """Resolve bank account details."""
        url = f"{self.base_url}/api/v1/misc/banks/resolve"
        payload = {
            "bank": bank_code,
            "account": account_number,
            "currency": "NGN"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            result = response.json()
            print("Korapay API Response:", result)  
            return result

    async def initiate_payout(self, withdrawal: Withdrawal, email: str = None) -> Optional[Payout]:
        """Initiate a payout for a withdrawal."""
        url = f"{self.base_url}/api/v1/transactions/disburse" 
        reference = str(uuid.uuid4())
        
        payload = {
            "reference": reference,
            "destination": {
                "type": "bank_account",
                "amount": str(withdrawal.amount),
                "currency": "NGN",
                "narration": f"Withdrawal payout for {withdrawal.user.first_name}",
                "bank_account": {
                    "bank": withdrawal.bank_code,
                    "account": withdrawal.account_number
                },
                "customer": {
                    "name": withdrawal.account_name,
                    "email": email 
                }
            }
        }
        print(f"Sending payload to Korapay: {json.dumps(payload, indent=2)}") 

        payout = None
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self.headers
                )
                response_data = response.json()
                response.raise_for_status()

                # Create payout record
                payout = await sync_to_async(Payout.objects.create)(
                    withdrawal=withdrawal,
                    reference=reference,
                    amount=withdrawal.amount,
                    bank_code=withdrawal.bank_code,
                    account_number=withdrawal.account_number,
                    account_name=withdrawal.account_name,
                    status='processing',
                    narration=payload['destination']['narration']
                )


                return payout
        
        except httpx.TimeoutException as e:
            error_detail = f"Payout request timed out after 30 seconds"
            print(error_detail)
            if payout:
                payout.status = 'failed'
                payout.failure_reason = error_detail
                payout.save()
            return None

        except httpx.HTTPError as e:
            error_detail = f"Payout failed - Status: {e.response.status_code if hasattr(e, 'response') else 'Unknown'}, Response: {e.response.text if hasattr(e, 'response') else 'No response'}"
            print(error_detail)
            if payout:
                payout.status = 'failed'
                payout.failure_reason = error_detail
                payout.save()
            return None
    async def check_payout_status(self, reference: str) -> Dict:
        """Check the status of a payout."""
        url = f"{self.base_url}/transactions/{reference}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()