import random
from datetime import datetime, timedelta

def compute_next_send_time(config, sends_today=0, campaign_day=1):
    """
    Computes a realistic human-like next send time using Gaussian jitter.
    Snaps to IST working hours (9AM-6PM).
    """
    base_hours = config.get("hours", 24)
    
    # Gaussian jitter: random.gauss(0, 15) minutes, clamped to ±30
    jitter_minutes = random.gauss(0, 15)
    jitter_minutes = max(-30.0, min(30.0, jitter_minutes))
    
    # Ramp up: min(1.0, 0.3 + (campaign_day-1) * 0.35)
    ramp_factor = min(1.0, 0.3 + (campaign_day - 1) * 0.35)
    _effective_cap = int(50 * ramp_factor) # Mock logic
    
    now = datetime.utcnow()
    candidate = now + timedelta(hours=base_hours) + timedelta(minutes=jitter_minutes)
    
    # Snap to IST hours (UTC + 5:30)
    ist_offset = timedelta(hours=5, minutes=30)
    ist_time = candidate + ist_offset
    hour = ist_time.hour
    
    if hour < 9:
        ist_time = ist_time.replace(hour=9, minute=int(abs(jitter_minutes) % 60), second=0)
    elif 11 <= hour < 14:
        ist_time = ist_time.replace(hour=14, minute=int(abs(jitter_minutes) % 60), second=0)
    elif hour >= 16:
        # Snap to next day 9 AM
        ist_time = (ist_time + timedelta(days=1)).replace(hour=9, minute=int(abs(jitter_minutes) % 60), second=0)
        
    final_utc = ist_time - ist_offset
    return final_utc, jitter_minutes

async def get_behavioral_pulse(campaign_id, session):
    """
    Returns simulated behavioral pulse for SSE stream.
    """
    return {
        "velocity_pct": int(random.uniform(40, 80)),
        "active_window": "9AM-11AM" if datetime.utcnow().hour % 2 == 0 else "2PM-4PM",
        "last_jitter_min": int(random.gauss(0, 15))
    }
