import requests
import json
import hashlib
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bank_fetch.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# API endpoint
url = "https://wg.gtrpay001.com/pay/bank_code"

# Request parameters
mch_id = "31993834"  # Merchant ID
passage_id = 26501  # Official channel ID
GTRPAY_SECRET_KEY = "f5e0c50ffe6843108a54a786194fc4c4"  # Replace with your actual secret key

# Generate signature for GTRPay
def generate_signature(params):
    logger.info("Generating signature...")
    # Sort keys alphabetically
    sorted_params = {k: params[k] for k in sorted(params.keys()) if k != 'sign' and params[k]}
    
    # Create string to sign
    sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
    sign_str += f"&key={GTRPAY_SECRET_KEY}"
    
    logger.info(f"Signature string: {sign_str}")
    
    # Create MD5 hash
    signature = hashlib.md5(sign_str.encode()).hexdigest()
    logger.info(f"Generated signature: {signature}")
    return signature

# Request payload
payload = {
    "mchId": mch_id,
    "passageId": passage_id
}

# Add signature to payload
payload["sign"] = generate_signature(payload)

logger.info(f"Sending request to {url} with payload: {json.dumps(payload)}")

# Make the API request
try:
    response = requests.post(url, json=payload)
    logger.info(f"Response status code: {response.status_code}")
    
    # Log the raw response for debugging
    logger.info(f"Raw response: {response.text[:500]}...")  # Log first 500 chars to avoid huge logs
    
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    # Parse the response
    data = response.json()
    
    # Check if the request was successful
    if data.get("code") == 200 or data.get("status") == "success":
        # Format the bank codes as needed
        bank_codes = data.get("data", {})
        logger.info(f"Successfully retrieved {len(bank_codes)} bank codes")
        
        # Save to banks.txt
        output_path = "fluxx_earn/banks.txt"
        with open(output_path, "w") as file:
            file.write("=const bankCodes = " + json.dumps(bank_codes, indent=2) + ";")
        
        logger.info(f"Bank codes successfully saved to {output_path}")
    else:
        error_msg = data.get('message', 'Unknown error')
        logger.error(f"API request failed: {error_msg}")
        logger.error(f"Full response: {data}")
        
except requests.exceptions.RequestException as e:
    logger.error(f"Request failed: {e}", exc_info=True)
except json.JSONDecodeError as e:
    logger.error(f"Failed to parse JSON response: {e}", exc_info=True)
    logger.error(f"Response content: {response.text}")
except Exception as e:
    logger.error(f"An unexpected error occurred: {e}", exc_info=True)
