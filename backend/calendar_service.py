import os
import datetime  # Fixes both datetime.datetime and datetime.timedelta bugs
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Define the scope
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    """Authenticates and returns the Google Calendar API service."""
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('calendar', 'v3', credentials=creds)


def schedule_task_to_google(task_details):
    service = get_calendar_service()
    
    event = {
        'summary': task_details['title'],
        'start': {'dateTime': task_details['start_time'], 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': task_details['end_time'], 'timeZone': 'Asia/Kolkata'},
    }
    
    return service.events().insert(calendarId='primary', body=event).execute()


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