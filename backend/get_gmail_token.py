"""
One-time script to authorize Gmail API and get a refresh token.
Run this locally (not on server) — it opens a browser for Google login.

Usage:
  1. Create a credentials.json file with your OAuth client config from Google Cloud Console
  2. python get_gmail_token.py
"""
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)

print("\n=== Save this value to your .env.production ===\n")
print(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
print(f"\nDone! You can now use Gmail API to send emails.")
