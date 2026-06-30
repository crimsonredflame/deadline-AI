import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_tasks_db = []

class TaskRequest(BaseModel):
    task: str

# Put your real API key here
client = genai.Client(api_key="AQ.Ab8RN6KFRvl_H2EjTY12NiEXAAj_K0r2QtxrGsliVqE5-w5fNw")

@app.post("/api/task")
async def plan_task(request: TaskRequest):
    # For the sake of your live demo, we are explicitly forcing this to start from Tuesday
    allowed_demo_days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    raw_input = request.task.strip()
    if raw_input and raw_input not in [t["raw"] for t in active_tasks_db]:
        active_tasks_db.append({
            "raw": raw_input,
            "added_at": "Tuesday, 11:00 AM" # Hardcoded anchor for the demo
        })
        
    prompt = f"""
    You are a strict task allocator.
    
    TASKS TO SCHEDULE:
    {json.dumps(active_tasks_db, indent=2)}
    
    CRITICAL RULE: You are ONLY allowed to assign these tasks to the following days: {allowed_demo_days}.
    ABSOLUTELY NO TASKS CAN BE SCHEDULED ON MONDAY. MONDAY DOES NOT EXIST.
    
    VALID TIME SLOTS:
    09:00 AM, 11:00 AM, 01:00 PM, 03:00 PM, 05:00 PM, 07:00 PM, 09:00 PM.
    
    Break down every task into steps. Ensure NO overlapping day/time slots.
    
    Respond ONLY with a JSON array matching this format:
    [
      {{"label": "Task Name: Step", "time": "Duration", "day": "Day Name, Hour:Minute AM/PM"}}
    ]
    Example: "Tuesday, 09:00 AM"
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0,
            ),
        )
        
        clean_text = response.text.strip().strip("`").replace("json\n", "")
        master_steps_data = json.loads(clean_text)
        
        # ☢️ THE HACKATHON NUKE: Post-processing to physically destroy Monday 
        # If the AI hallucinates Monday, we force it to Tuesday/Wednesday
        fallback_slots = ["Tuesday, 01:00 PM", "Tuesday, 03:00 PM", "Wednesday, 09:00 AM", "Wednesday, 11:00 AM"]
        slot_index = 0
        
        for step in master_steps_data:
            if "Monday" in step.get("day", ""):
                print("⚠️ CAUGHT MONDAY HALLUCINATION - OVERWRITING TO TUESDAY")
                step["day"] = fallback_slots[slot_index % len(fallback_slots)]
                slot_index += 1

        return {"steps": master_steps_data}
        
    except Exception as e:
        print(f"AI Error: {e}")
        return {"steps": [{"label": "Matrix Error", "time": "0", "day": "Tuesday, 09:00 AM"}]}

@app.post("/api/reschedule")
async def reschedule():
    global active_tasks_db
    active_tasks_db = []
    return {"status": "success", "message": "State cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)