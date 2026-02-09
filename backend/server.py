from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'dealcentric_secret_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Deal-Centric PMS API")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== USER ROLES ====================
class UserRole:
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    SALES_AGENT = "sales_agent"
    PARTNER = "partner"
    SUPERVISOR = "supervisor"
    FABRICATOR = "fabricator"
    CLIENT_B2B = "client_b2b"
    CLIENT_RESIDENTIAL = "client_residential"

# ==================== DEAL STAGES ====================
class DealStage:
    INQUIRY = "inquiry"
    QUOTATION = "quotation"
    NEGOTIATION = "negotiation"
    CONTRACT = "contract"
    EXECUTION = "execution"
    FABRICATION = "fabrication"
    INSTALLATION = "installation"
    HANDOVER = "handover"
    COMPLETED = "completed"
    CLOSED = "closed"

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None
    commission_rate: Optional[float] = None  # For sales agents

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    commission_rate: Optional[float] = None

class DealCreate(BaseModel):
    name: str
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    client_type: str  # B2B or residential
    service_types: List[str]
    estimated_value: float
    description: Optional[str] = None
    referral_agent_id: Optional[str] = None  # Sales agent who referred
    partner_ids: List[str] = []

class DealUpdate(BaseModel):
    name: Optional[str] = None
    stage: Optional[str] = None
    estimated_value: Optional[float] = None
    contract_value: Optional[float] = None
    description: Optional[str] = None
    assigned_pm: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TaskCreate(BaseModel):
    deal_id: str
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    assigned_to: Optional[str] = None
    is_milestone: bool = False
    is_client_visible: bool = False

class DocumentCreate(BaseModel):
    deal_id: str
    name: str
    doc_type: str
    category: str  # client_facing, internal, deal_relationship
    is_client_visible: bool = False

class ProgressUpdate(BaseModel):
    deal_id: str
    notes: str
    progress_percentage: float
    is_client_visible: bool = True
    task_id: Optional[str] = None

class QuotationCreate(BaseModel):
    deal_id: str
    version: int = 1
    total_amount: float
    items: List[Dict[str, Any]]
    notes: Optional[str] = None
    validity_days: int = 30

class CommissionCreate(BaseModel):
    deal_id: str
    agent_id: str
    rate: float
    milestone_triggers: List[Dict[str, Any]]  # When to release commission

class MessageCreate(BaseModel):
    deal_id: str
    content: str
    visible_to_roles: List[str]  # Which roles can see this message

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

async def log_activity(entity_id: str, action: str, description: str, user_id: str):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "entity_id": entity_id,
        "action": action,
        "description": description,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
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
        "commission_rate": user_data.commission_rate,
        "is_active": True,
        "created_at": now,
        "deals_won": 0,
        "total_commission_earned": 0
    }
    
    await db.users.insert_one(user_doc)
    await log_activity(user_id, "user_created", f"User {user_data.name} created", current_user["id"])
    
    return {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password"}}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== USER MANAGEMENT ====================

@api_router.get("/users")
async def get_users(role: Optional[str] = None, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.delete("/users/{user_id}")
async def deactivate_user(user_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": "User deactivated"}

# ==================== DEAL MANAGEMENT ====================

@api_router.post("/deals")
async def create_deal(deal: DealCreate, current_user: dict = Depends(get_current_user)):
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Set referral agent based on who created or specified
    referral_agent_id = deal.referral_agent_id
    if current_user["role"] == UserRole.SALES_AGENT and not referral_agent_id:
        referral_agent_id = current_user["id"]
    
    deal_doc = {
        "id": deal_id,
        "name": deal.name,
        "client_name": deal.client_name,
        "client_email": deal.client_email,
        "client_phone": deal.client_phone,
        "client_type": deal.client_type,
        "service_types": deal.service_types,
        "estimated_value": deal.estimated_value,
        "contract_value": None,
        "description": deal.description,
        "stage": DealStage.INQUIRY,
        "referral_agent_id": referral_agent_id,
        "partner_ids": deal.partner_ids,
        "assigned_pm": None,
        "assigned_supervisor": None,
        "assigned_fabricators": [],
        "start_date": None,
        "end_date": None,
        "progress_percentage": 0,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
        "client_visible_notes": [],
        "internal_notes": []
    }
    
    await db.deals.insert_one(deal_doc)
    await log_activity(deal_id, "deal_created", f"Deal '{deal.name}' created", current_user["id"])
    
    # Create commission record if agent is assigned
    if referral_agent_id:
        agent = await db.users.find_one({"id": referral_agent_id}, {"_id": 0})
        if agent and agent.get("commission_rate"):
            await db.commissions.insert_one({
                "id": str(uuid.uuid4()),
                "deal_id": deal_id,
                "agent_id": referral_agent_id,
                "rate": agent["commission_rate"],
                "status": "pending",
                "earned_amount": 0,
                "released_amount": 0,
                "created_at": now
            })
    
    return {k: v for k, v in deal_doc.items() if k != "_id"}

@api_router.get("/deals")
async def get_deals(stage: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    role = current_user["role"]
    
    # Role-based filtering
    if role == UserRole.SALES_AGENT:
        query["referral_agent_id"] = current_user["id"]
    elif role == UserRole.PARTNER:
        query["partner_ids"] = current_user["id"]
    elif role == UserRole.PROJECT_MANAGER:
        query["assigned_pm"] = current_user["id"]
    elif role == UserRole.SUPERVISOR:
        query["assigned_supervisor"] = current_user["id"]
    elif role == UserRole.FABRICATOR:
        query["assigned_fabricators"] = current_user["id"]
    elif role in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        query["$or"] = [
            {"client_email": current_user["email"]},
            {"client_id": current_user["id"]}
        ]
    
    if stage:
        query["stage"] = stage
    
    deals = await db.deals.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Filter sensitive data for non-admin roles
    if role not in [UserRole.ADMIN, UserRole.PROJECT_MANAGER]:
        for deal in deals:
            if role in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
                # Clients don't see internal costs
                deal.pop("internal_notes", None)
            elif role == UserRole.SALES_AGENT:
                # Agents don't see margin data
                deal.pop("internal_notes", None)
    
    return deals

@api_router.get("/deals/{deal_id}")
async def get_deal(deal_id: str, current_user: dict = Depends(get_current_user)):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    role = current_user["role"]
    
    # Filter based on role
    if role in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        deal.pop("internal_notes", None)
        deal.pop("referral_agent_id", None)
    elif role == UserRole.SALES_AGENT:
        deal.pop("internal_notes", None)
    elif role == UserRole.FABRICATOR:
        # Fabricators only see assigned job details
        pass
    
    return deal

@api_router.put("/deals/{deal_id}")
async def update_deal(deal_id: str, update: DealUpdate, current_user: dict = Depends(get_current_user)):
    allowed_roles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    
    # Update commission if stage changed to contract
    if update.stage == DealStage.CONTRACT and update.contract_value:
        commission = await db.commissions.find_one({"deal_id": deal_id}, {"_id": 0})
        if commission:
            earned = update.contract_value * (commission["rate"] / 100)
            await db.commissions.update_one(
                {"deal_id": deal_id},
                {"$set": {"earned_amount": earned, "status": "active"}}
            )
    
    await log_activity(deal_id, "deal_updated", f"Deal updated to stage {update.stage}", current_user["id"])
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return deal

@api_router.post("/deals/{deal_id}/assign")
async def assign_team(
    deal_id: str,
    pm_id: Optional[str] = None,
    supervisor_id: Optional[str] = None,
    fabricator_ids: Optional[List[str]] = None,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
):
    update = {}
    if pm_id:
        update["assigned_pm"] = pm_id
    if supervisor_id:
        update["assigned_supervisor"] = supervisor_id
    if fabricator_ids:
        update["assigned_fabricators"] = fabricator_ids
    
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.deals.update_one({"id": deal_id}, {"$set": update})
    
    return {"message": "Team assigned"}

# ==================== QUOTATION MANAGEMENT ====================

@api_router.post("/quotations")
async def create_quotation(quotation: QuotationCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    quot_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    quot_doc = {
        "id": quot_id,
        "deal_id": quotation.deal_id,
        "version": quotation.version,
        "total_amount": quotation.total_amount,
        "items": quotation.items,
        "notes": quotation.notes,
        "validity_days": quotation.validity_days,
        "status": "draft",
        "client_approved": False,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.quotations.insert_one(quot_doc)
    
    # Update deal stage
    await db.deals.update_one({"id": quotation.deal_id}, {"$set": {"stage": DealStage.QUOTATION}})
    
    return {k: v for k, v in quot_doc.items() if k != "_id"}

@api_router.get("/quotations")
async def get_quotations(deal_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if deal_id:
        query["deal_id"] = deal_id
    
    quotations = await db.quotations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # For clients, only show sent quotations
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        quotations = [q for q in quotations if q["status"] == "sent"]
    
    return quotations

@api_router.put("/quotations/{quot_id}/send")
async def send_quotation(quot_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    await db.quotations.update_one({"id": quot_id}, {"$set": {"status": "sent"}})
    return {"message": "Quotation sent to client"}

@api_router.put("/quotations/{quot_id}/approve")
async def approve_quotation(quot_id: str, approved: bool, current_user: dict = Depends(get_current_user)):
    # Clients or admin can approve
    status = "approved" if approved else "rejected"
    await db.quotations.update_one({"id": quot_id}, {"$set": {"status": status, "client_approved": approved}})
    
    if approved:
        quot = await db.quotations.find_one({"id": quot_id}, {"_id": 0})
        if quot:
            await db.deals.update_one(
                {"id": quot["deal_id"]},
                {"$set": {"stage": DealStage.CONTRACT, "contract_value": quot["total_amount"]}}
            )
    
    return {"message": f"Quotation {status}"}

# ==================== TASK MANAGEMENT ====================

@api_router.post("/tasks")
async def create_task(task: TaskCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    task_doc = {
        "id": task_id,
        "deal_id": task.deal_id,
        "name": task.name,
        "description": task.description,
        "start_date": task.start_date,
        "end_date": task.end_date,
        "assigned_to": task.assigned_to,
        "status": "pending",
        "progress": 0,
        "is_milestone": task.is_milestone,
        "is_client_visible": task.is_client_visible,
        "created_at": now
    }
    
    await db.tasks.insert_one(task_doc)
    return {k: v for k, v in task_doc.items() if k != "_id"}

@api_router.get("/tasks")
async def get_tasks(deal_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if deal_id:
        query["deal_id"] = deal_id
    
    # Filter by assignment for operational roles
    if current_user["role"] in [UserRole.SUPERVISOR, UserRole.FABRICATOR]:
        query["assigned_to"] = current_user["id"]
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("start_date", 1).to_list(1000)
    
    # Clients only see client-visible tasks
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        tasks = [t for t in tasks if t.get("is_client_visible", False)]
    
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, status: Optional[str] = None, progress: Optional[float] = None, current_user: dict = Depends(get_current_user)):
    update = {}
    if status:
        update["status"] = status
    if progress is not None:
        update["progress"] = progress
    
    if update:
        await db.tasks.update_one({"id": task_id}, {"$set": update})
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    # Update deal progress
    if task:
        await update_deal_progress(task["deal_id"])
    
    return task

async def update_deal_progress(deal_id: str):
    tasks = await db.tasks.find({"deal_id": deal_id}, {"_id": 0}).to_list(100)
    if tasks:
        total = sum(t.get("progress", 0) for t in tasks) / len(tasks)
        await db.deals.update_one({"id": deal_id}, {"$set": {"progress_percentage": round(total, 2)}})

# ==================== PROGRESS UPDATES ====================

@api_router.post("/progress-updates")
async def create_progress_update(
    deal_id: str = Form(...),
    notes: str = Form(...),
    progress_percentage: float = Form(...),
    is_client_visible: bool = Form(True),
    task_id: Optional[str] = Form(None),
    photos: List[UploadFile] = File(default=[]),
    current_user: dict = Depends(get_current_user)
):
    update_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save photos
    photo_paths = []
    for photo in photos:
        ext = photo.filename.split(".")[-1] if "." in photo.filename else "jpg"
        fname = f"{update_id}_{len(photo_paths)}.{ext}"
        fpath = UPLOAD_DIR / fname
        content = await photo.read()
        with open(fpath, "wb") as f:
            f.write(content)
        photo_paths.append(f"/uploads/{fname}")
    
    update_doc = {
        "id": update_id,
        "deal_id": deal_id,
        "notes": notes,
        "progress_percentage": progress_percentage,
        "photos": photo_paths,
        "is_client_visible": is_client_visible,
        "task_id": task_id,
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "created_at": now
    }
    
    await db.progress_updates.insert_one(update_doc)
    
    # Update task if specified
    if task_id:
        await db.tasks.update_one({"id": task_id}, {"$set": {"progress": progress_percentage}})
    
    # Update deal progress
    await db.deals.update_one({"id": deal_id}, {"$set": {"progress_percentage": progress_percentage}})
    
    return {k: v for k, v in update_doc.items() if k != "_id"}

@api_router.get("/progress-updates")
async def get_progress_updates(deal_id: str, current_user: dict = Depends(get_current_user)):
    updates = await db.progress_updates.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Filter for clients
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        updates = [u for u in updates if u.get("is_client_visible", False)]
    
    return updates

# ==================== DOCUMENT MANAGEMENT ====================

@api_router.post("/documents/upload")
async def upload_document(
    deal_id: str = Form(...),
    name: str = Form(...),
    doc_type: str = Form(...),
    category: str = Form(...),
    is_client_visible: bool = Form(False),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    fname = f"{doc_id}.{ext}"
    fpath = UPLOAD_DIR / fname
    content = await file.read()
    with open(fpath, "wb") as f:
        f.write(content)
    
    # Check version
    existing = await db.documents.find_one({"deal_id": deal_id, "name": name}, {"_id": 0})
    version = (existing.get("version", 0) + 1) if existing else 1
    
    doc = {
        "id": doc_id,
        "deal_id": deal_id,
        "name": name,
        "doc_type": doc_type,
        "category": category,  # client_facing, internal, deal_relationship
        "file_path": f"/uploads/{fname}",
        "version": version,
        "is_client_visible": is_client_visible,
        "approval_status": "pending",
        "uploaded_by": current_user["id"],
        "uploaded_by_name": current_user["name"],
        "created_at": now
    }
    
    await db.documents.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/documents")
async def get_documents(deal_id: Optional[str] = None, category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if deal_id:
        query["deal_id"] = deal_id
    if category:
        query["category"] = category
    
    docs = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Filter for clients
    if current_user["role"] in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        docs = [d for d in docs if d.get("is_client_visible", False) and d.get("approval_status") == "approved"]
    
    # Filter for agents
    if current_user["role"] == UserRole.SALES_AGENT:
        docs = [d for d in docs if d.get("category") != "internal"]
    
    return docs

@api_router.put("/documents/{doc_id}/approve")
async def approve_document(doc_id: str, approved: bool, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))):
    status = "approved" if approved else "rejected"
    await db.documents.update_one({"id": doc_id}, {"$set": {"approval_status": status}})
    return {"message": f"Document {status}"}

# ==================== COMMISSION TRACKING ====================

@api_router.get("/commissions")
async def get_commissions(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == UserRole.SALES_AGENT:
        query["agent_id"] = current_user["id"]
    
    commissions = await db.commissions.find(query, {"_id": 0}).to_list(500)
    
    # Enrich with deal info
    for comm in commissions:
        deal = await db.deals.find_one({"id": comm["deal_id"]}, {"_id": 0})
        if deal:
            comm["deal_name"] = deal.get("name")
            comm["deal_stage"] = deal.get("stage")
            comm["deal_value"] = deal.get("contract_value") or deal.get("estimated_value")
    
    return commissions

@api_router.put("/commissions/{comm_id}/release")
async def release_commission(comm_id: str, amount: float, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    comm = await db.commissions.find_one({"id": comm_id}, {"_id": 0})
    if not comm:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    new_released = comm.get("released_amount", 0) + amount
    await db.commissions.update_one(
        {"id": comm_id},
        {"$set": {"released_amount": new_released}}
    )
    
    # Update agent stats
    await db.users.update_one(
        {"id": comm["agent_id"]},
        {"$inc": {"total_commission_earned": amount}}
    )
    
    return {"message": f"Released ${amount}"}

# ==================== MESSAGES ====================

@api_router.post("/messages")
async def create_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    msg_doc = {
        "id": msg_id,
        "deal_id": message.deal_id,
        "content": message.content,
        "visible_to_roles": message.visible_to_roles,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_role": current_user["role"],
        "created_at": now
    }
    
    await db.messages.insert_one(msg_doc)
    return {k: v for k, v in msg_doc.items() if k != "_id"}

@api_router.get("/messages")
async def get_messages(deal_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    # Filter by role visibility
    role = current_user["role"]
    messages = [m for m in messages if role in m.get("visible_to_roles", []) or m["sender_id"] == current_user["id"]]
    
    return messages

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    stats = {}
    
    if role == UserRole.ADMIN:
        total_deals = await db.deals.count_documents({})
        active_deals = await db.deals.count_documents({"stage": {"$nin": [DealStage.COMPLETED, DealStage.CLOSED]}})
        total_value = 0
        deals = await db.deals.find({}, {"_id": 0}).to_list(1000)
        for d in deals:
            total_value += d.get("contract_value") or d.get("estimated_value") or 0
        
        stats = {
            "total_deals": total_deals,
            "active_deals": active_deals,
            "completed_deals": await db.deals.count_documents({"stage": DealStage.COMPLETED}),
            "total_pipeline_value": total_value,
            "pending_approvals": await db.documents.count_documents({"approval_status": "pending"}),
            "total_agents": await db.users.count_documents({"role": UserRole.SALES_AGENT}),
            "total_partners": await db.users.count_documents({"role": UserRole.PARTNER})
        }
    
    elif role == UserRole.SALES_AGENT:
        my_deals = await db.deals.find({"referral_agent_id": current_user["id"]}, {"_id": 0}).to_list(100)
        commissions = await db.commissions.find({"agent_id": current_user["id"]}, {"_id": 0}).to_list(100)
        
        total_earned = sum(c.get("earned_amount", 0) for c in commissions)
        total_released = sum(c.get("released_amount", 0) for c in commissions)
        
        stats = {
            "total_deals": len(my_deals),
            "active_deals": len([d for d in my_deals if d["stage"] not in [DealStage.COMPLETED, DealStage.CLOSED]]),
            "deals_won": len([d for d in my_deals if d.get("contract_value")]),
            "total_commission_earned": total_earned,
            "commission_released": total_released,
            "commission_pending": total_earned - total_released,
            "pipeline_value": sum(d.get("estimated_value", 0) for d in my_deals if d["stage"] not in [DealStage.COMPLETED, DealStage.CLOSED])
        }
    
    elif role == UserRole.PROJECT_MANAGER:
        my_deals = await db.deals.find({"assigned_pm": current_user["id"]}, {"_id": 0}).to_list(100)
        stats = {
            "assigned_deals": len(my_deals),
            "in_execution": len([d for d in my_deals if d["stage"] in [DealStage.EXECUTION, DealStage.FABRICATION, DealStage.INSTALLATION]]),
            "pending_handover": len([d for d in my_deals if d["stage"] == DealStage.HANDOVER]),
            "overdue_tasks": await db.tasks.count_documents({"assigned_to": {"$exists": True}, "status": {"$ne": "completed"}, "end_date": {"$lt": datetime.now(timezone.utc).isoformat()[:10]}})
        }
    
    elif role in [UserRole.CLIENT_B2B, UserRole.CLIENT_RESIDENTIAL]:
        my_deals = await db.deals.find({"$or": [{"client_email": current_user["email"]}, {"client_id": current_user["id"]}]}, {"_id": 0}).to_list(50)
        stats = {
            "my_projects": len(my_deals),
            "in_progress": len([d for d in my_deals if d["stage"] not in [DealStage.COMPLETED, DealStage.CLOSED, DealStage.INQUIRY]]),
            "completed": len([d for d in my_deals if d["stage"] == DealStage.COMPLETED])
        }
    
    elif role == UserRole.SUPERVISOR:
        stats = {
            "assigned_sites": await db.deals.count_documents({"assigned_supervisor": current_user["id"]}),
            "pending_updates": await db.tasks.count_documents({"assigned_to": current_user["id"], "status": {"$ne": "completed"}})
        }
    
    elif role == UserRole.FABRICATOR:
        tasks = await db.tasks.find({"assigned_to": current_user["id"]}, {"_id": 0}).to_list(100)
        stats = {
            "assigned_jobs": len(tasks),
            "pending_jobs": len([t for t in tasks if t["status"] != "completed"]),
            "completed_jobs": len([t for t in tasks if t["status"] == "completed"])
        }
    
    elif role == UserRole.PARTNER:
        my_deals = await db.deals.find({"partner_ids": current_user["id"]}, {"_id": 0}).to_list(100)
        stats = {
            "involved_deals": len(my_deals),
            "active_collaborations": len([d for d in my_deals if d["stage"] not in [DealStage.COMPLETED, DealStage.CLOSED]])
        }
    
    return stats

@api_router.get("/dashboard/pipeline")
async def get_pipeline(current_user: dict = Depends(get_current_user)):
    stages = [DealStage.INQUIRY, DealStage.QUOTATION, DealStage.NEGOTIATION, DealStage.CONTRACT, 
              DealStage.EXECUTION, DealStage.FABRICATION, DealStage.INSTALLATION, DealStage.HANDOVER, DealStage.COMPLETED]
    
    pipeline = []
    for stage in stages:
        count = await db.deals.count_documents({"stage": stage})
        deals_in_stage = await db.deals.find({"stage": stage}, {"_id": 0}).to_list(100)
        value = sum(d.get("contract_value") or d.get("estimated_value") or 0 for d in deals_in_stage)
        pipeline.append({"stage": stage, "count": count, "value": value})
    
    return pipeline

@api_router.get("/dashboard/recent-activity")
async def get_recent_activity(limit: int = 20, current_user: dict = Depends(get_current_user)):
    activities = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return activities

# ==================== INIT ADMIN ====================

@api_router.post("/init-admin")
async def init_admin():
    admin = await db.users.find_one({"role": UserRole.ADMIN})
    if admin:
        return {"message": "Admin exists", "created": False}
    
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create Admin
    await db.users.insert_one({
        "id": admin_id,
        "email": "admin@dealcentric.com",
        "password": hash_password("Admin@123"),
        "name": "System Administrator",
        "role": UserRole.ADMIN,
        "is_active": True,
        "created_at": now
    })
    
    # Create Sales Agent
    agent_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": agent_id,
        "email": "agent@dealcentric.com",
        "password": hash_password("Agent@123"),
        "name": "John Agent",
        "role": UserRole.SALES_AGENT,
        "commission_rate": 5.0,
        "is_active": True,
        "created_at": now,
        "deals_won": 0,
        "total_commission_earned": 0
    })
    
    # Create Project Manager
    pm_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": pm_id,
        "email": "pm@dealcentric.com",
        "password": hash_password("PM@123"),
        "name": "Sarah Manager",
        "role": UserRole.PROJECT_MANAGER,
        "is_active": True,
        "created_at": now
    })
    
    # Create Site Supervisor
    supervisor_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": supervisor_id,
        "email": "supervisor@dealcentric.com",
        "password": hash_password("Super@123"),
        "name": "Mike Supervisor",
        "role": UserRole.SUPERVISOR,
        "is_active": True,
        "created_at": now
    })
    
    # Create Fabricator
    fabricator_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": fabricator_id,
        "email": "fab@dealcentric.com",
        "password": hash_password("Fab@123"),
        "name": "Tony Fabricator",
        "role": UserRole.FABRICATOR,
        "is_active": True,
        "created_at": now
    })
    
    # Create Strategic Partner
    partner_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": partner_id,
        "email": "partner@dealcentric.com",
        "password": hash_password("Partner@123"),
        "name": "Lisa Partner",
        "role": UserRole.PARTNER,
        "company": "Partner Corp",
        "is_active": True,
        "created_at": now
    })
    
    # Create B2B Client
    client_b2b_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": client_b2b_id,
        "email": "client@dealcentric.com",
        "password": hash_password("Client@123"),
        "name": "ABC Corporation",
        "role": UserRole.CLIENT_B2B,
        "company": "ABC Corp",
        "is_active": True,
        "created_at": now
    })
    
    # Create Residential Client
    client_res_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": client_res_id,
        "email": "homeowner@dealcentric.com",
        "password": hash_password("Home@123"),
        "name": "David Homeowner",
        "role": UserRole.CLIENT_RESIDENTIAL,
        "is_active": True,
        "created_at": now
    })
    
    return {
        "message": "Initial users created",
        "created": True,
        "users": [
            {"email": "admin@dealcentric.com", "password": "Admin@123", "role": "admin"},
            {"email": "agent@dealcentric.com", "password": "Agent@123", "role": "sales_agent"},
            {"email": "pm@dealcentric.com", "password": "PM@123", "role": "project_manager"},
            {"email": "supervisor@dealcentric.com", "password": "Super@123", "role": "supervisor"},
            {"email": "fab@dealcentric.com", "password": "Fab@123", "role": "fabricator"},
            {"email": "partner@dealcentric.com", "password": "Partner@123", "role": "partner"},
            {"email": "client@dealcentric.com", "password": "Client@123", "role": "client_b2b"},
            {"email": "homeowner@dealcentric.com", "password": "Home@123", "role": "client_residential"}
        ]
    }

@api_router.get("/")
async def root():
    return {"message": "Deal-Centric PMS API", "version": "2.0.0"}

# Include router
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
