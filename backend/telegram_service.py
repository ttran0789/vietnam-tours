import os
import logging
import requests
from threading import Thread

logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def _is_configured() -> bool:
    return bool(BOT_TOKEN and ADMIN_CHAT_ID)


def send_telegram(text: str):
    """Send message to admin via Telegram. Non-blocking."""
    if not _is_configured():
        logger.info(f"Telegram not configured. Would send: {text}")
        return

    def _do_send():
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            requests.post(url, json={
                "chat_id": ADMIN_CHAT_ID,
                "text": text,
                "parse_mode": "HTML",
            }, timeout=10)
        except Exception as e:
            logger.error(f"Telegram send failed: {e}")

    Thread(target=_do_send, daemon=True).start()


def notify_new_chat(conversation_id: str, name: str, message: str):
    """Notify admin of new chat message."""
    text = f"💬 <b>{name}</b> (#{conversation_id})\n{message}\n\n<i>Reply: #{conversation_id} your message</i>"
    send_telegram(text)
