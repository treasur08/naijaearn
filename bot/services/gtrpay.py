import os
import httpx
import json
import hashlib
from decimal import Decimal
from typing import Dict, Optional
from django.conf import settings
from ..models import Withdrawal, Payout
import uuid
from asgiref.sync import sync_to_async
import logging

logger = logging.getLogger(__name__)

class GTRPayService:
    def __init__(self):
        self.base_url = "https://wg.gtrpay001.com/pay"
        self.mch_id = settings.MERCHANT_ID
        self.passage_id = settings.PASSAGE_ID
        self.secret_key = settings.GTRPAY_SECRET_KEY
        
    def generate_signature(self, params):
        """Generate signature for GTRPay API requests"""
        # Sort keys alphabetically
        sorted_params = {k: params[k] for k in sorted(params.keys()) if k != 'sign' and params[k]}
        
        # Create string to sign
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
        sign_str += f"&key={self.secret_key}"
        
        logger.debug(f"Signature string: {sign_str}")
        
        # Create MD5 hash
        return hashlib.md5(sign_str.encode()).hexdigest()

   

    async def initiate_payout(self, withdrawal: Withdrawal, email: str = None) -> Optional[Payout]:
        """Initiate a payout for a withdrawal using GTRPay."""
        url = f"{self.base_url}/create"
        reference = str(uuid.uuid4())
        
        # Find the bank code from the bank name in banks.txt
        bank_code = withdrawal.bank_code  # This should be the NG code from the banks.txt
        
        # Prepare payload according to GTRPay documentation
        payload = {
            "mchId": self.mch_id,
            "passageId": self.passage_id,
            "orderAmount": str(withdrawal.amount),
            "orderNo": reference,
            "account": withdrawal.account_number,
            "userName": withdrawal.account_name,
            "remark": bank_code,  # Bank code goes in remark field
            "email": email or "user@example.com",  # Default email if not provided
            "notifyUrl": f"{settings.BASE_URL}/webhook/gtrpay/"
        }
        
        # Generate signature and add to payload
        payload["sign"] = self.generate_signature(payload)
        
        logger.info(f"Sending payload to GTRPay: {json.dumps(payload, indent=2)}")

        payout = None
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response_data = response.json()
                logger.info(f"GTRPay API Response: {json.dumps(response_data, indent=2)}")
                
                if response_data.get("code") != 200:
                    error_msg = response_data.get("msg", "Unknown error")
                    logger.error(f"GTRPay payout failed: {error_msg}")
                    return None
                
                # Extract trade number from response
                trade_no = response_data.get("data", {}).get("tradeNo")
                
                # Create payout record
                payout = await sync_to_async(Payout.objects.create)(
                    withdrawal=withdrawal,
                    reference=reference,
                    provider_reference=trade_no,
                    amount=withdrawal.amount,
                    bank_code=withdrawal.bank_code,
                    account_number=withdrawal.account_number,
                    account_name=withdrawal.account_name,
                    status='processing',
                    narration=f"Withdrawal payout for {withdrawal.user.first_name}"
                )

                return payout
        
        except httpx.TimeoutException as e:
            error_detail = f"Payout request timed out after 30 seconds"
            logger.error(error_detail)
            if payout:
                payout.status = 'failed'
                payout.failure_reason = error_detail
                await sync_to_async(payout.save)()
            return None

        except httpx.HTTPError as e:
            error_detail = f"Payout failed - Status: {e.response.status_code if hasattr(e, 'response') else 'Unknown'}, Response: {e.response.text if hasattr(e, 'response') else 'No response'}"
            logger.error(error_detail)
            if payout:
                payout.status = 'failed'
                payout.failure_reason = error_detail
                await sync_to_async(payout.save)()
            return None
        
        except Exception as e:
            error_detail = f"Unexpected error during payout: {str(e)}"
            logger.error(error_detail, exc_info=True)
            if payout:
                payout.status = 'failed'
                payout.failure_reason = error_detail
                await sync_to_async(payout.save)()
            return None

    async def check_payout_status(self, reference: str) -> Dict:
        """Check the status of a payout."""
        # This would need to be implemented based on GTRPay's API
        # For now, we'll return a placeholder response
        return {
            "status": "success",
            "data": {
                "status": "processing"
            }
        }
