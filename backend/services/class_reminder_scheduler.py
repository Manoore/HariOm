"""
Class Reminder Scheduler
Background task that checks upcoming classes and sends push + in-app notifications
to enrolled students and priests who have set reminders.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database import (
    class_reminders_collection, priest_classes_collection,
    priests_collection, users_collection
)

logger = logging.getLogger(__name__)

# Track if scheduler is running
_scheduler_running = False


def parse_next_class_time(cls):
    """
    Determine the next class datetime from the class document.
    Classes can have:
    - schedule_time (ISO datetime string or datetime object)
    - start_time + schedule_day + frequency for recurring classes
    """
    schedule_time = cls.get("schedule_time")

    # If schedule_time is already a datetime
    if isinstance(schedule_time, datetime):
        return schedule_time

    # If it's an ISO string
    if isinstance(schedule_time, str):
        try:
            dt = datetime.fromisoformat(schedule_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            pass

    # For recurring classes with start_time (HH:MM) and schedule_day
    start_time = cls.get("start_time")
    schedule_day = cls.get("schedule_day")
    frequency = cls.get("frequency", "one_time")

    if start_time and frequency != "one_time":
        try:
            now = datetime.now(timezone.utc)
            hour, minute = map(int, start_time.split(":"))
            # Find the next occurrence
            days_map = {
                "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
                "Friday": 4, "Saturday": 5, "Sunday": 6
            }
            if schedule_day and schedule_day in days_map:
                target_weekday = days_map[schedule_day]
                days_ahead = target_weekday - now.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                if days_ahead == 0:
                    # Same day — check if time has passed
                    candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    if candidate < now:
                        days_ahead = 7
                next_date = now + timedelta(days=days_ahead)
                return next_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            else:
                # Daily or no specific day — use today/tomorrow
                candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if candidate < now:
                    candidate += timedelta(days=1)
                return candidate
        except (ValueError, TypeError):
            pass

    return None


async def check_and_send_reminders():
    """
    Check all active reminders against upcoming class times.
    Send notifications where the class is within the reminder window.
    """
    try:
        from services.notification_service import notify_class_reminder, notify_priest_class_reminder
    except ImportError:
        logger.warning("Notification service not available, skipping reminder check")
        return

    now = datetime.now(timezone.utc)

    # Get all enabled reminders
    cursor = class_reminders_collection.find({"enabled": True})
    reminders = await cursor.to_list(length=500)

    if not reminders:
        return

    # Group by class_id for efficiency
    class_ids = list(set(r["class_id"] for r in reminders))

    for class_id in class_ids:
        try:
            cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
            if not cls:
                continue

            next_class_time = parse_next_class_time(cls)
            if not next_class_time:
                continue

            # Get class reminders for this class
            class_reminders = [r for r in reminders if r["class_id"] == class_id]

            # Fetch priest info once
            priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
            teacher_name = priest_user.get("name", "Teacher") if priest_user else "Teacher"

            for reminder in class_reminders:
                remind_before = reminder.get("remind_before_minutes", 60)
                reminder_time = next_class_time - timedelta(minutes=remind_before)

                # Check if we're within the reminder window (within 2 minutes tolerance)
                if not (reminder_time <= now <= reminder_time + timedelta(minutes=2)):
                    continue

                # Check if already sent for this class time
                last_sent = reminder.get("last_sent_for")
                if last_sent:
                    if isinstance(last_sent, str):
                        try:
                            last_sent = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
                        except (ValueError, TypeError):
                            last_sent = None
                    if last_sent and isinstance(last_sent, datetime):
                        if last_sent.tzinfo is None:
                            last_sent = last_sent.replace(tzinfo=timezone.utc)
                        # Already sent for this session (within 12 hours)
                        if abs((last_sent - next_class_time).total_seconds()) < 43200:
                            continue

                # Format time_until
                diff = next_class_time - now
                minutes_until = int(diff.total_seconds() / 60)
                if minutes_until >= 1440:
                    time_until = f"{minutes_until // 1440} day(s)"
                elif minutes_until >= 60:
                    time_until = f"{minutes_until // 60} hour(s)"
                else:
                    time_until = f"{minutes_until} minute(s)"

                # Send the notification
                role = reminder.get("role", "student")
                user_id = reminder["user_id"]

                try:
                    if role == "priest":
                        await notify_priest_class_reminder(user_id, {
                            "class_name": cls.get("title", "Vedic Class"),
                            "time_until": time_until,
                            "enrolled_count": str(cls.get("enrolled_count", 0)),
                        })
                    else:
                        await notify_class_reminder(user_id, {
                            "class_name": cls.get("title", "Vedic Class"),
                            "teacher_name": teacher_name,
                            "time_until": time_until,
                        })

                    # Mark as sent
                    await class_reminders_collection.update_one(
                        {"_id": reminder["_id"]},
                        {"$set": {"last_sent_for": next_class_time}}
                    )
                    logger.info(f"Sent class reminder to {user_id} for class {class_id} ({role})")
                except Exception as e:
                    logger.error(f"Failed to send class reminder to {user_id}: {e}")

        except Exception as e:
            logger.error(f"Error processing reminders for class {class_id}: {e}")


async def reminder_scheduler_loop():
    """Main loop — runs every 60 seconds"""
    global _scheduler_running
    _scheduler_running = True
    logger.info("Class reminder scheduler started")

    while _scheduler_running:
        try:
            await check_and_send_reminders()
        except Exception as e:
            logger.error(f"Reminder scheduler error: {e}")
        await asyncio.sleep(60)


def start_reminder_scheduler():
    """Start the background scheduler (call from server startup)"""
    asyncio.get_event_loop().create_task(reminder_scheduler_loop())
    logger.info("Class reminder scheduler task created")


def stop_reminder_scheduler():
    """Stop the background scheduler"""
    global _scheduler_running
    _scheduler_running = False
    logger.info("Class reminder scheduler stopped")
