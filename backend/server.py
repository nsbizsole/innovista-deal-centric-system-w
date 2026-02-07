from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'pms_secret_key_2024_construction')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Construction PMS API")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# User Roles
class UserRole:
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    SALES_AGENT = "sales_agent"
    PARTNER = "partner"
    SUPERVISOR = "supervisor"
    FABRICATOR = "fabricator"
    CLIENT_B2B = "client_b2b"
    CLIENT_RESIDENTIAL = "client_residential"

# Project Status
class ProjectStatus:
    PLANNING = "planning"
    PROCUREMENT = "procurement"
    FABRICATION = "fabrication"
    INSTALLATION = "installation"
    HANDOVER = "handover"
    CLOSED = "closed"

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None
    is_active: bool = True
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

# Project Models
class ProjectCreate(BaseModel):
    name: str
    client_id: str
    client_type: str  # B2B or residential
    service_types: List[str]  # aluminum_fab, steel_fab, interior, construction, renovation
    approved_value: float
    start_date: str
    end_date: str
    description: Optional[str] = None
    linked_contract_id: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    approved_value: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    actuals: Optional[float] = None
    assigned_pm: Optional[str] = None

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    client_id: str
    client_type: str
    service_types: List[str]
    approved_value: float
    start_date: str
    end_date: str
    status: str
    description: Optional[str] = None
    budget: float = 0
    actuals: float = 0
    assigned_pm: Optional[str] = None
    linked_contract_id: Optional[str] = None
    created_at: str
    updated_at: str
    progress_percentage: float = 0

# Task Models
class TaskCreate(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    dependencies: List[str] = []
    assigned_users: List[str] = []
    is_milestone: bool = False

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    dependencies: Optional[List[str]] = None
    assigned_users: Optional[List[str]] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    status: str
    progress: float
    dependencies: List[str]
    assigned_users: List[str]
    is_milestone: bool
    created_at: str

# Document Models
class DocumentCreate(BaseModel):
    project_id: str
    name: str
    doc_type: str  # contract_addendum, shop_drawing, RFI, invoice, asbuilt, photo
    tags: List[str] = []
    linked_task_id: Optional[str] = None

class DocumentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    name: str
    doc_type: str
    file_path: str
    version: int
    uploader_id: str
    uploader_name: Optional[str] = None
    approval_status: str
    tags: List[str]
    linked_task_id: Optional[str] = None
    created_at: str

# Change Order Models
class ChangeOrderCreate(BaseModel):
    project_id: str
    description: str
    change_type: str  # add_item, remove_item, modify
    value_impact: float  # positive or negative
    linked_task_id: Optional[str] = None

class ChangeOrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    description: str
    change_type: str
    value_impact: float
    approval_status: str
    requested_by: str
    approved_by: Optional[str] = None
    linked_task_id: Optional[str] = None
    created_at: str

# Financial Entry Models
class FinancialEntryCreate(BaseModel):
    project_id: str
    entry_type: str  # invoice, payment, budget_line, variation
    amount: float
    description: str
    linked_milestone_id: Optional[str] = None

class FinancialEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    entry_type: str
    amount: float
    description: str
    status: str
    linked_milestone_id: Optional[str] = None
    created_by: str
    created_at: str

# Progress Log Models
class ProgressLogCreate(BaseModel):
    project_id: str
    notes: str
    progress_update: float
    task_id: Optional[str] = None

class ProgressLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    user_id: str
    user_name: Optional[str] = None
    notes: str
    photos: List[str]
    progress_update: float
    task_id: Optional[str] = None
    created_at: str

# Message Models
class MessageCreate(BaseModel):
    project_id: str
    content: str
    thread_id: Optional[str] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    thread_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    created_at: str

# Dashboard Models
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_budget: float
    total_actuals: float
    pending_approvals: int
    overdue_tasks: int

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="User is deactivated")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "phone": user_data.phone,
        "company": user_data.company,
        "is_active": True,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Log activity
    await log_activity(user_id, "user_created", f"User {user_data.name} created by admin", current_user["id"])
    
    return {k: v for k, v in user_doc.items() if k != "password"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_token(user["id"], user["role"])
    
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k != "password"}
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== USER MANAGEMENT ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await log_activity(user_id, "user_updated", f"User updated by admin", current_user["id"])
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await log_activity(user_id, "user_deactivated", f"User deactivated by admin", current_user["id"])
    
    return {"message": "User deactivated"}

# ==================== PROJECT ENDPOINTS ====================

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    project_doc = {
        "id": project_id,
        "name": project.name,
        "client_id": project.client_id,
        "client_type": project.client_type,
        "service_types": project.service_types,
        "approved_value": project.approved_value,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "description": project.description,
        "linked_contract_id": project.linked_contract_id,
        "status": ProjectStatus.PLANNING,
        "budget": project.approved_value,
        "actuals": 0,
        "assigned_pm": current_user["id"] if current_user["role"] == UserRole.PROJECT_MANAGER else None,
        "progress_percentage": 0,
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.projects.insert_one(project_doc)
    await log_activity(project_id, "project_created", f"Project '{project.name}' created", current_user["id"])
    
    return project_doc

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: dict = Depends(get_current_user)):
    query = {}
    
    # Role-based filtering
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["client_id"] = current_user["id"]
    elif current_user["role"] == UserRole.PROJECT_MANAGER:
        query["assigned_pm"] = current_user["id"]
    elif current_user["role"] in [UserRole.SALES_AGENT, UserRole.PARTNER]:
        query["$or"] = [
            {"created_by": current_user["id"]},
            {"assigned_users": current_user["id"]}
        ]
    elif current_user["role"] in [UserRole.SUPERVISOR, UserRole.FABRICATOR]:
        # Get projects where user is assigned to tasks
        task_project_ids = await db.tasks.distinct("project_id", {"assigned_users": current_user["id"]})
        query["id"] = {"$in": task_project_ids}
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Access control
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        if project["client_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return project

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, update: ProjectUpdate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await log_activity(project_id, "project_updated", f"Project updated", current_user["id"])
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Cascade delete related data
    await db.tasks.delete_many({"project_id": project_id})
    await db.documents.delete_many({"project_id": project_id})
    await db.change_orders.delete_many({"project_id": project_id})
    await db.financial_entries.delete_many({"project_id": project_id})
    await db.progress_logs.delete_many({"project_id": project_id})
    await db.messages.delete_many({"project_id": project_id})
    
    await log_activity(project_id, "project_deleted", f"Project deleted", current_user["id"])
    
    return {"message": "Project deleted"}

# ==================== TASK ENDPOINTS ====================

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    task_doc = {
        "id": task_id,
        "project_id": task.project_id,
        "name": task.name,
        "description": task.description,
        "start_date": task.start_date,
        "end_date": task.end_date,
        "status": "pending",
        "progress": 0,
        "dependencies": task.dependencies,
        "assigned_users": task.assigned_users,
        "is_milestone": task.is_milestone,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.tasks.insert_one(task_doc)
    await log_activity(task.project_id, "task_created", f"Task '{task.name}' created", current_user["id"])
    
    return task_doc

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    # Role-based filtering for operational users
    if current_user["role"] in [UserRole.SUPERVISOR, UserRole.FABRICATOR]:
        query["assigned_users"] = current_user["id"]
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("start_date", 1).to_list(1000)
    return tasks

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@api_router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    # Check permissions
    if current_user["role"] not in [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SUPERVISOR, UserRole.FABRICATOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    # Update project progress
    await update_project_progress(task["project_id"])
    
    await log_activity(task["project_id"], "task_updated", f"Task '{task['name']}' updated", current_user["id"])
    
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.delete_one({"id": task_id})
    await log_activity(task["project_id"], "task_deleted", f"Task deleted", current_user["id"])
    
    return {"message": "Task deleted"}

async def update_project_progress(project_id: str):
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    if tasks:
        total_progress = sum(t.get("progress", 0) for t in tasks) / len(tasks)
        await db.projects.update_one({"id": project_id}, {"$set": {"progress_percentage": round(total_progress, 2)}})

# ==================== DOCUMENT ENDPOINTS ====================

@api_router.post("/documents")
async def upload_document(
    project_id: str,
    name: str,
    doc_type: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_name = f"{doc_id}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Check for existing versions
    existing = await db.documents.find_one({"project_id": project_id, "name": name}, {"_id": 0})
    version = (existing.get("version", 0) + 1) if existing else 1
    
    doc_doc = {
        "id": doc_id,
        "project_id": project_id,
        "name": name,
        "doc_type": doc_type,
        "file_path": f"/uploads/{file_name}",
        "version": version,
        "uploader_id": current_user["id"],
        "uploader_name": current_user["name"],
        "approval_status": "pending",
        "tags": [],
        "linked_task_id": None,
        "created_at": now
    }
    
    await db.documents.insert_one(doc_doc)
    await log_activity(project_id, "document_uploaded", f"Document '{name}' uploaded", current_user["id"])
    
    return doc_doc

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(project_id: Optional[str] = None, doc_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if doc_type:
        query["doc_type"] = doc_type
    
    # Clients can only see approved documents
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["approval_status"] = "approved"
    
    docs = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.put("/documents/{doc_id}/approve")
async def approve_document(doc_id: str, approved: bool, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    status = "approved" if approved else "rejected"
    result = await db.documents.update_one({"id": doc_id}, {"$set": {"approval_status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    await log_activity(doc["project_id"], "document_approval", f"Document '{doc['name']}' {status}", current_user["id"])
    
    return {"message": f"Document {status}"}

# ==================== CHANGE ORDER ENDPOINTS ====================

@api_router.post("/change-orders", response_model=ChangeOrderResponse)
async def create_change_order(change_order: ChangeOrderCreate, current_user: dict = Depends(get_current_user)):
    co_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    co_doc = {
        "id": co_id,
        "project_id": change_order.project_id,
        "description": change_order.description,
        "change_type": change_order.change_type,
        "value_impact": change_order.value_impact,
        "approval_status": "pending",
        "requested_by": current_user["id"],
        "approved_by": None,
        "linked_task_id": change_order.linked_task_id,
        "created_at": now
    }
    
    await db.change_orders.insert_one(co_doc)
    await log_activity(change_order.project_id, "change_order_created", f"Change order created: {change_order.description}", current_user["id"])
    
    return co_doc

@api_router.get("/change-orders", response_model=List[ChangeOrderResponse])
async def get_change_orders(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    cos = await db.change_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return cos

@api_router.put("/change-orders/{co_id}/approve")
async def approve_change_order(co_id: str, approved: bool, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    status = "approved" if approved else "rejected"
    
    co = await db.change_orders.find_one({"id": co_id}, {"_id": 0})
    if not co:
        raise HTTPException(status_code=404, detail="Change order not found")
    
    await db.change_orders.update_one({"id": co_id}, {"$set": {"approval_status": status, "approved_by": current_user["id"]}})
    
    # If approved, update project value
    if approved:
        project = await db.projects.find_one({"id": co["project_id"]}, {"_id": 0})
        new_value = project["approved_value"] + co["value_impact"]
        new_budget = project["budget"] + co["value_impact"]
        await db.projects.update_one({"id": co["project_id"]}, {"$set": {"approved_value": new_value, "budget": new_budget}})
    
    await log_activity(co["project_id"], "change_order_approval", f"Change order {status}", current_user["id"])
    
    return {"message": f"Change order {status}"}

# ==================== FINANCIAL ENDPOINTS ====================

@api_router.post("/financial-entries", response_model=FinancialEntryResponse)
async def create_financial_entry(entry: FinancialEntryCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    entry_doc = {
        "id": entry_id,
        "project_id": entry.project_id,
        "entry_type": entry.entry_type,
        "amount": entry.amount,
        "description": entry.description,
        "status": "pending",
        "linked_milestone_id": entry.linked_milestone_id,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.financial_entries.insert_one(entry_doc)
    
    # Update project actuals if it's a payment
    if entry.entry_type == "payment":
        await db.projects.update_one({"id": entry.project_id}, {"$inc": {"actuals": entry.amount}})
    
    await log_activity(entry.project_id, "financial_entry_created", f"{entry.entry_type}: {entry.amount}", current_user["id"])
    
    return entry_doc

@api_router.get("/financial-entries", response_model=List[FinancialEntryResponse])
async def get_financial_entries(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    # Clients can only see invoices
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["entry_type"] = "invoice"
    
    entries = await db.financial_entries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return entries

@api_router.put("/financial-entries/{entry_id}/status")
async def update_financial_status(entry_id: str, status: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.financial_entries.update_one({"id": entry_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Financial entry not found")
    
    entry = await db.financial_entries.find_one({"id": entry_id}, {"_id": 0})
    await log_activity(entry["project_id"], "financial_status_updated", f"Financial entry status: {status}", current_user["id"])
    
    return {"message": "Status updated"}

# ==================== PROGRESS LOG ENDPOINTS ====================

@api_router.post("/progress-logs")
async def create_progress_log(
    project_id: str,
    notes: str,
    progress_update: float,
    task_id: Optional[str] = None,
    photos: List[UploadFile] = File(default=[]),
    current_user: dict = Depends(get_current_user)
):
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save photos
    photo_paths = []
    for photo in photos:
        file_ext = photo.filename.split(".")[-1] if "." in photo.filename else "jpg"
        file_name = f"{log_id}_{len(photo_paths)}.{file_ext}"
        file_path = UPLOAD_DIR / file_name
        content = await photo.read()
        with open(file_path, "wb") as f:
            f.write(content)
        photo_paths.append(f"/uploads/{file_name}")
    
    log_doc = {
        "id": log_id,
        "project_id": project_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "notes": notes,
        "photos": photo_paths,
        "progress_update": progress_update,
        "task_id": task_id,
        "created_at": now
    }
    
    await db.progress_logs.insert_one(log_doc)
    
    # Update task progress if task_id provided
    if task_id:
        await db.tasks.update_one({"id": task_id}, {"$set": {"progress": progress_update}})
        await update_project_progress(project_id)
    
    await log_activity(project_id, "progress_logged", f"Progress: {progress_update}%", current_user["id"])
    
    return log_doc

@api_router.get("/progress-logs", response_model=List[ProgressLogResponse])
async def get_progress_logs(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    logs = await db.progress_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return logs

# ==================== MESSAGE ENDPOINTS ====================

@api_router.post("/messages", response_model=MessageResponse)
async def create_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg_id = str(uuid.uuid4())
    thread_id = message.thread_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    msg_doc = {
        "id": msg_id,
        "project_id": message.project_id,
        "thread_id": thread_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "content": message.content,
        "created_at": now
    }
    
    await db.messages.insert_one(msg_doc)
    
    return msg_doc

@api_router.get("/messages", response_model=List[MessageResponse])
async def get_messages(project_id: str, thread_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"project_id": project_id}
    if thread_id:
        query["thread_id"] = thread_id
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return messages

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    query = {}
    
    # Role-based filtering
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["client_id"] = current_user["id"]
    elif current_user["role"] == UserRole.PROJECT_MANAGER:
        query["assigned_pm"] = current_user["id"]
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    
    total = len(projects)
    active = sum(1 for p in projects if p["status"] not in [ProjectStatus.CLOSED, ProjectStatus.HANDOVER])
    completed = sum(1 for p in projects if p["status"] == ProjectStatus.CLOSED)
    total_budget = sum(p.get("budget", 0) for p in projects)
    total_actuals = sum(p.get("actuals", 0) for p in projects)
    
    # Pending approvals
    pending_cos = await db.change_orders.count_documents({"approval_status": "pending"})
    pending_docs = await db.documents.count_documents({"approval_status": "pending"})
    
    # Overdue tasks
    today = datetime.now(timezone.utc).isoformat()[:10]
    overdue = await db.tasks.count_documents({"end_date": {"$lt": today}, "status": {"$ne": "completed"}})
    
    return DashboardStats(
        total_projects=total,
        active_projects=active,
        completed_projects=completed,
        total_budget=total_budget,
        total_actuals=total_actuals,
        pending_approvals=pending_cos + pending_docs,
        overdue_tasks=overdue
    )

@api_router.get("/dashboard/recent-activities")
async def get_recent_activities(limit: int = 20, current_user: dict = Depends(get_current_user)):
    activities = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return activities

@api_router.get("/dashboard/project-summary")
async def get_project_summary(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["client_id"] = current_user["id"]
    elif current_user["role"] == UserRole.PROJECT_MANAGER:
        query["assigned_pm"] = current_user["id"]
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    
    # Group by status
    by_status = {}
    for p in projects:
        status = p["status"]
        if status not in by_status:
            by_status[status] = 0
        by_status[status] += 1
    
    # Group by service type
    by_service = {}
    for p in projects:
        for s in p.get("service_types", []):
            if s not in by_service:
                by_service[s] = 0
            by_service[s] += 1
    
    return {
        "by_status": by_status,
        "by_service": by_service,
        "total": len(projects)
    }

# ==================== ACTIVITY LOG ====================

async def log_activity(entity_id: str, action: str, description: str, user_id: str):
    log_doc = {
        "id": str(uuid.uuid4()),
        "entity_id": entity_id,
        "action": action,
        "description": description,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log_doc)

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id, "user_id": current_user["id"]}, {"$set": {"is_read": True}})
    return {"message": "Notification marked as read"}

# ==================== GANTT DATA ====================

@api_router.get("/projects/{project_id}/gantt")
async def get_gantt_data(project_id: str, current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).sort("start_date", 1).to_list(1000)
    
    gantt_tasks = []
    for task in tasks:
        gantt_tasks.append({
            "id": task["id"],
            "name": task["name"],
            "start": task["start_date"],
            "end": task["end_date"],
            "progress": task.get("progress", 0),
            "dependencies": task.get("dependencies", []),
            "type": "milestone" if task.get("is_milestone") else "task",
            "status": task.get("status", "pending")
        })
    
    return {"tasks": gantt_tasks}

# ==================== INIT ADMIN ====================

@api_router.post("/init-admin")
async def init_admin():
    # Check if admin exists
    admin = await db.users.find_one({"role": UserRole.ADMIN})
    if admin:
        return {"message": "Admin already exists", "created": False}
    
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    admin_doc = {
        "id": admin_id,
        "email": "admin@pms.com",
        "password": hash_password("Admin@123"),
        "name": "System Administrator",
        "role": UserRole.ADMIN,
        "phone": None,
        "company": "PMS Construction",
        "is_active": True,
        "created_at": now
    }
    
    await db.users.insert_one(admin_doc)
    
    return {"message": "Admin created", "created": True, "email": "admin@pms.com", "password": "Admin@123"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Construction PMS API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
