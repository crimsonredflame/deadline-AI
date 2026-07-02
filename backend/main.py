import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai  # 👑 Legacy SDK use kar rahe hain jo conflict nahi karta
import os

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_tasks_db = []

class TaskRequest(BaseModel):
    task: str

# 👑 Cloud Run Dashboard se GEMINI_API_KEY automatic read hogi
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_KEY)

@app.post("/api/task")
async def plan_task(request: TaskRequest):
    allowed_demo_days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    raw_input = request.task.strip()
    if raw_input and raw_input not in [t["raw"] for t in active_tasks_db]:
        active_tasks_db.append({
            "raw": raw_input,
            "added_at": "Tuesday, 11:00 AM" 
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
        # Purane SDK ka model invocation syntax
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.0,
            )
        )
        
        clean_text = response.text.strip().strip("`").replace("json\n", "")
        master_steps_data = json.loads(clean_text)
        
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
        return {"steps": [{"label": f"Matrix Error: {str(e)}", "time": "0", "day": "Tuesday, 09:00 AM"}]}

@app.post("/api/reschedule")
async def reschedule():
    global active_tasks_db
    active_tasks_db = []
    return {"status": "success", "message": "State cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
