from calendar_service import get_calendar_service

def schedule_task_to_google(task_details):
    service = get_calendar_service() # This now works!
    
    event = {
        'summary': task_details['title'],
        'start': {'dateTime': task_details['start_time'], 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': task_details['end_time'], 'timeZone': 'Asia/Kolkata'},
    }
    
    return service.events().insert(calendarId='primary', body=event).execute()
from datetime import datetime
def get_free_slots(service, start_time, end_time):
    # Ask Google Calendar when you are busy
    body = {
        "timeMin": start_time.isoformat() + 'Z',
        "timeMax": end_time.isoformat() + 'Z',
        "items": [{"id": "primary"}]
    }
    # This returns busy intervals
    events = service.freebusy().query(body=body).execute()
    return events['calendars']['primary']['busy']

def schedule_subtasks(task_name, sub_tasks):
    service = get_calendar_service()
    # Start looking from now
    current_time = datetime.datetime.utcnow()

    for task in sub_tasks:
        duration = task['duration_minutes']
        
        # Simple Conflict Resolution: 
        # Check if the current proposed slot is busy
        # In a production app, you'd loop until you find a gap.
        
        event = {
            'summary': f"Sorted: {task['title']} ({task_name})",
            'start': {
                'dateTime': current_time.isoformat() + 'Z',
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': (current_time + datetime.timedelta(minutes=duration)).isoformat() + 'Z',
                'timeZone': 'Asia/Kolkata',
            }
        }
        
        # Insert into Google Calendar
        service.events().insert(calendarId='primary', body=event).execute()
        
        # Advance current_time by the duration PLUS a 15-minute buffer
        current_time += datetime.timedelta(minutes=duration + 15)

    return "Scheduled successfully"