"""
DealCentric API Tests - Comprehensive backend testing for Deal-Centric PMS
Tests all user roles, authentication, deals, messages, documents, and dashboard endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pmsdash-2.preview.emergentagent.com')

# Test credentials for all roles
TEST_USERS = {
    "admin": {"email": "admin@dealcentric.com", "password": "Admin@123"},
    "sales_agent": {"email": "agent@dealcentric.com", "password": "Agent@123"},
    "project_manager": {"email": "pm@dealcentric.com", "password": "PM@123"},
    "client_b2b": {"email": "client@dealcentric.com", "password": "Client@123"},
    "supervisor": {"email": "supervisor@dealcentric.com", "password": "Super@123"},
    "fabricator": {"email": "fab@dealcentric.com", "password": "Fab@123"},
    "partner": {"email": "partner@dealcentric.com", "password": "Partner@123"},
}


class TestHealthAndInit:
    """Test API health and initialization"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Deal-Centric PMS API"
        print(f"✓ API root working: {data}")
    
    def test_init_admin(self):
        """Test init-admin endpoint creates demo users"""
        response = requests.post(f"{BASE_URL}/api/init-admin")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Init admin: {data['message']}")


class TestAuthentication:
    """Test authentication for all user roles"""
    
    @pytest.fixture(scope="class")
    def tokens(self):
        """Get tokens for all roles"""
        tokens = {}
        for role, creds in TEST_USERS.items():
            response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
            if response.status_code == 200:
                tokens[role] = response.json()["token"]
        return tokens
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_sales_agent_login(self):
        """Test sales agent login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["sales_agent"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "sales_agent"
        print(f"✓ Sales agent login successful: {data['user']['name']}")
    
    def test_project_manager_login(self):
        """Test project manager login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["project_manager"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "project_manager"
        print(f"✓ PM login successful: {data['user']['name']}")
    
    def test_client_login(self):
        """Test client login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["client_b2b"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "client_b2b"
        print(f"✓ Client login successful: {data['user']['name']}")
    
    def test_supervisor_login(self):
        """Test supervisor login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["supervisor"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "supervisor"
        print(f"✓ Supervisor login successful: {data['user']['name']}")
    
    def test_fabricator_login(self):
        """Test fabricator login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["fabricator"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "fabricator"
        print(f"✓ Fabricator login successful: {data['user']['name']}")
    
    def test_partner_login(self):
        """Test partner login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["partner"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "partner"
        print(f"✓ Partner login successful: {data['user']['name']}")
    
    def test_invalid_login(self):
        """Test invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me(self, tokens):
        """Test /auth/me endpoint"""
        if "admin" not in tokens:
            pytest.skip("Admin token not available")
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {tokens['admin']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USERS["admin"]["email"]
        print(f"✓ Auth/me working: {data['name']}")


class TestUserManagement:
    """Test user management endpoints (admin only)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_users(self, admin_token):
        """Test getting all users"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 7  # At least 7 demo users
        print(f"✓ Get users: {len(users)} users found")
    
    def test_get_users_by_role(self, admin_token):
        """Test filtering users by role"""
        response = requests.get(f"{BASE_URL}/api/users?role=sales_agent", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        users = response.json()
        for user in users:
            assert user["role"] == "sales_agent"
        print(f"✓ Filter users by role: {len(users)} sales agents")


class TestDealManagement:
    """Test deal CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def agent_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["sales_agent"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Agent login failed")
    
    @pytest.fixture(scope="class")
    def pm_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["project_manager"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("PM login failed")
    
    def test_create_deal_as_admin(self, admin_token):
        """Test creating a deal as admin"""
        deal_data = {
            "name": "TEST_Admin Deal Creation",
            "client_name": "Test Client Corp",
            "client_email": "testclient@example.com",
            "client_phone": "+1234567890",
            "client_type": "B2B",
            "service_types": ["fabrication", "installation"],
            "estimated_value": 50000,
            "description": "Test deal created by admin"
        }
        response = requests.post(f"{BASE_URL}/api/deals", json=deal_data, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == deal_data["name"]
        assert data["stage"] == "inquiry"
        assert "id" in data
        print(f"✓ Deal created: {data['name']} (ID: {data['id'][:8]}...)")
        return data["id"]
    
    def test_create_deal_as_agent(self, agent_token):
        """Test creating a deal as sales agent (referral)"""
        deal_data = {
            "name": "TEST_Agent Referral Deal",
            "client_name": "Referred Client",
            "client_type": "residential",
            "service_types": ["glass_work"],
            "estimated_value": 25000,
            "description": "Referral from sales agent"
        }
        response = requests.post(f"{BASE_URL}/api/deals", json=deal_data, headers={
            "Authorization": f"Bearer {agent_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["referral_agent_id"] is not None  # Agent should be auto-assigned
        print(f"✓ Agent referral created: {data['name']}")
    
    def test_get_deals(self, admin_token):
        """Test getting all deals"""
        response = requests.get(f"{BASE_URL}/api/deals", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        deals = response.json()
        assert isinstance(deals, list)
        print(f"✓ Get deals: {len(deals)} deals found")
    
    def test_get_deals_by_stage(self, admin_token):
        """Test filtering deals by stage"""
        response = requests.get(f"{BASE_URL}/api/deals?stage=inquiry", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        deals = response.json()
        for deal in deals:
            assert deal["stage"] == "inquiry"
        print(f"✓ Filter deals by stage: {len(deals)} in inquiry")
    
    def test_update_deal_stage(self, pm_token, admin_token):
        """Test updating deal stage"""
        # First get a deal
        response = requests.get(f"{BASE_URL}/api/deals", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        deals = response.json()
        if not deals:
            pytest.skip("No deals to update")
        
        deal_id = deals[0]["id"]
        
        # Update stage
        response = requests.put(f"{BASE_URL}/api/deals/{deal_id}", json={
            "stage": "quotation"
        }, headers={
            "Authorization": f"Bearer {pm_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["stage"] == "quotation"
        print(f"✓ Deal stage updated to: {data['stage']}")


class TestMessaging:
    """Test messaging functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def deal_id(self, admin_token):
        """Get or create a deal for messaging tests"""
        response = requests.get(f"{BASE_URL}/api/deals", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        deals = response.json()
        if deals:
            return deals[0]["id"]
        pytest.skip("No deals available for messaging test")
    
    def test_create_message(self, admin_token, deal_id):
        """Test creating a message"""
        message_data = {
            "deal_id": deal_id,
            "content": "TEST_Message from admin",
            "visible_to_roles": ["admin", "project_manager", "client_b2b"]
        }
        response = requests.post(f"{BASE_URL}/api/messages", json=message_data, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == message_data["content"]
        assert "id" in data
        print(f"✓ Message created: {data['content'][:30]}...")
    
    def test_get_messages(self, admin_token, deal_id):
        """Test getting messages for a deal"""
        response = requests.get(f"{BASE_URL}/api/messages?deal_id={deal_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        print(f"✓ Get messages: {len(messages)} messages found")


class TestDashboard:
    """Test dashboard endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def agent_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["sales_agent"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Agent login failed")
    
    def test_admin_dashboard_stats(self, admin_token):
        """Test admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        stats = response.json()
        assert "total_deals" in stats
        assert "active_deals" in stats
        assert "total_pipeline_value" in stats
        print(f"✓ Admin stats: {stats['total_deals']} deals, ${stats['total_pipeline_value']} pipeline")
    
    def test_agent_dashboard_stats(self, agent_token):
        """Test agent dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers={
            "Authorization": f"Bearer {agent_token}"
        })
        assert response.status_code == 200
        stats = response.json()
        assert "total_deals" in stats
        assert "total_commission_earned" in stats
        print(f"✓ Agent stats: {stats['total_deals']} deals, ${stats.get('total_commission_earned', 0)} commission")
    
    def test_pipeline(self, admin_token):
        """Test pipeline endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/pipeline", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        pipeline = response.json()
        assert isinstance(pipeline, list)
        # Check pipeline has stage data
        for stage in pipeline:
            assert "stage" in stage
            assert "count" in stage
            assert "value" in stage
        print(f"✓ Pipeline: {len(pipeline)} stages")
    
    def test_recent_activity(self, admin_token):
        """Test recent activity endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/recent-activity", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        activities = response.json()
        assert isinstance(activities, list)
        print(f"✓ Recent activity: {len(activities)} activities")


class TestTasks:
    """Test task management"""
    
    @pytest.fixture(scope="class")
    def pm_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["project_manager"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("PM login failed")
    
    @pytest.fixture(scope="class")
    def deal_id(self, pm_token):
        response = requests.get(f"{BASE_URL}/api/deals", headers={
            "Authorization": f"Bearer {pm_token}"
        })
        deals = response.json()
        if deals:
            return deals[0]["id"]
        pytest.skip("No deals available")
    
    def test_create_task(self, pm_token, deal_id):
        """Test creating a task"""
        task_data = {
            "deal_id": deal_id,
            "name": "TEST_Task Creation",
            "description": "Test task for deal",
            "start_date": "2024-01-15",
            "end_date": "2024-01-30",
            "is_milestone": False,
            "is_client_visible": True
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers={
            "Authorization": f"Bearer {pm_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == task_data["name"]
        print(f"✓ Task created: {data['name']}")
    
    def test_get_tasks(self, pm_token, deal_id):
        """Test getting tasks for a deal"""
        response = requests.get(f"{BASE_URL}/api/tasks?deal_id={deal_id}", headers={
            "Authorization": f"Bearer {pm_token}"
        })
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)
        print(f"✓ Get tasks: {len(tasks)} tasks found")


class TestQuotations:
    """Test quotation management"""
    
    @pytest.fixture(scope="class")
    def pm_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["project_manager"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("PM login failed")
    
    @pytest.fixture(scope="class")
    def deal_id(self, pm_token):
        response = requests.get(f"{BASE_URL}/api/deals", headers={
            "Authorization": f"Bearer {pm_token}"
        })
        deals = response.json()
        if deals:
            return deals[0]["id"]
        pytest.skip("No deals available")
    
    def test_create_quotation(self, pm_token, deal_id):
        """Test creating a quotation"""
        quot_data = {
            "deal_id": deal_id,
            "version": 1,
            "total_amount": 75000,
            "items": [
                {"description": "Glass panels", "quantity": 10, "unit_price": 5000},
                {"description": "Installation", "quantity": 1, "unit_price": 25000}
            ],
            "notes": "Valid for 30 days",
            "validity_days": 30
        }
        response = requests.post(f"{BASE_URL}/api/quotations", json=quot_data, headers={
            "Authorization": f"Bearer {pm_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["total_amount"] == quot_data["total_amount"]
        print(f"✓ Quotation created: ${data['total_amount']}")
    
    def test_get_quotations(self, pm_token, deal_id):
        """Test getting quotations"""
        response = requests.get(f"{BASE_URL}/api/quotations?deal_id={deal_id}", headers={
            "Authorization": f"Bearer {pm_token}"
        })
        assert response.status_code == 200
        quotations = response.json()
        assert isinstance(quotations, list)
        print(f"✓ Get quotations: {len(quotations)} quotations found")


class TestCommissions:
    """Test commission tracking"""
    
    @pytest.fixture(scope="class")
    def agent_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["sales_agent"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Agent login failed")
    
    def test_get_commissions(self, agent_token):
        """Test getting commissions for agent"""
        response = requests.get(f"{BASE_URL}/api/commissions", headers={
            "Authorization": f"Bearer {agent_token}"
        })
        assert response.status_code == 200
        commissions = response.json()
        assert isinstance(commissions, list)
        print(f"✓ Get commissions: {len(commissions)} commission records")


class TestDocuments:
    """Test document management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["admin"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_documents(self, admin_token):
        """Test getting documents"""
        response = requests.get(f"{BASE_URL}/api/documents", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        documents = response.json()
        assert isinstance(documents, list)
        print(f"✓ Get documents: {len(documents)} documents found")


class TestRoleBasedAccess:
    """Test role-based access control"""
    
    @pytest.fixture(scope="class")
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["client_b2b"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Client login failed")
    
    @pytest.fixture(scope="class")
    def fabricator_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USERS["fabricator"])
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Fabricator login failed")
    
    def test_client_cannot_access_users(self, client_token):
        """Test client cannot access user management"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {client_token}"
        })
        assert response.status_code == 403
        print("✓ Client correctly denied access to users")
    
    def test_fabricator_dashboard_stats(self, fabricator_token):
        """Test fabricator gets appropriate dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers={
            "Authorization": f"Bearer {fabricator_token}"
        })
        assert response.status_code == 200
        stats = response.json()
        assert "assigned_jobs" in stats
        print(f"✓ Fabricator stats: {stats.get('assigned_jobs', 0)} assigned jobs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
