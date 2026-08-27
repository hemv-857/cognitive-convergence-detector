"""Route alerts via Discord webhooks and email (free alternatives to Slack)."""

import logging
import smtplib
from email.mime.text import MIMEText

import requests

from app.config import settings

logger = logging.getLogger(__name__)


def send_discord_alert(alert: dict) -> bool:
    """Send alert to Discord via webhook (free)."""
    if not settings.DISCORD_WEBHOOK_URL:
        return False

    severity_colors = {
        "warning": 0xf59e0b,
        "high": 0xef4444,
        "critical": 0xdc2626,
    }
    color = severity_colors.get(alert["severity"], 0x888888)

    embed = {
        "title": f"Convergence Alert: {alert['severity'].upper()}",
        "description": alert.get("message", ""),
        "color": color,
        "fields": [],
    }
    if alert.get("manager_a"):
        embed["fields"].append({
            "name": "Manager Pair",
            "value": f"{alert['manager_a']} <-> {alert['manager_b']}",
            "inline": True,
        })
    if alert.get("asset_class"):
        embed["fields"].append({
            "name": "Asset Class",
            "value": alert["asset_class"],
            "inline": True,
        })
    if alert.get("correlation"):
        embed["fields"].append({
            "name": "Correlation",
            "value": f"{alert['correlation']:.4f}",
            "inline": True,
        })

    try:
        resp = requests.post(
            settings.DISCORD_WEBHOOK_URL,
            json={"embeds": [embed]},
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Discord alert failed: {e}")
        return False


def send_email_alert(alert: dict) -> bool:
    """Send alert via email (free, uses smtplib)."""
    if not settings.SMTP_USER or not settings.ALERT_EMAIL_TO:
        return False

    msg = MIMEText(
        f"Convergence Alert: {alert['severity'].upper()}\n\n"
        f"{alert.get('message', '')}\n\n"
        f"Manager A: {alert.get('manager_a', 'N/A')}\n"
        f"Manager B: {alert.get('manager_b', 'N/A')}\n"
        f"Asset Class: {alert.get('asset_class', 'N/A')}\n"
        f"Correlation: {alert.get('correlation', 'N/A')}\n"
    )
    msg["Subject"] = f"[Convergence Alert] {alert['severity'].upper()}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = settings.ALERT_EMAIL_TO

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Email alert failed: {e}")
        return False


def route_alert_sync(alert: dict):
    """Synchronous alert routing."""
    send_discord_alert(alert)
    send_email_alert(alert)
