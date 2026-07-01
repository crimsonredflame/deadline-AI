# 🚀 Deadline AI: Autonomous Task Scheduler & Core Engine

An intelligent, cloud-native automation tool built for hackathons that transforms unstructured natural language commands (e.g., *"submit my ML assignment by Friday"*) into structured, conflict-free timeline slots directly synchronized with the **Google Calendar API**.

---

## 🌐 Live Deployments
* **Production Frontend UI:** [https://deadline-app-165865432967.europe-west1.run.app](https://deadline-app-165865432967.europe-west1.run.app)
* **Production Backend API:** `https://deadline-backend-xxxx.europe-west1.run.app` *(Note: Update this with your final backend Cloud Run URL once active)*

---

## 📁 Repository Structure
The repository is organized as a monorepo splitting the decoupled client-side asset delivery from the serverless API processor:

```text
deadline-AI/
├── frontend/                  # React + Vite Client Application
│   ├── src/                   # React components and state management
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies & scripts
│   └── Dockerfile             # Multi-stage production Nginx container configuration
├── backend/                   # FastAPI Python Application
│   ├── main.py                # Core API routing and LLM processing logic
│   ├── requirements.txt       # Python dependencies (FastAPI, Uvicorn, Google Auth)
│   └── Dockerfile             # Python Alpine containerized execution environment
└── README.md                  # System documentation & architectural map
