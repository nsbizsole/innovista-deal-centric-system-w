import requests
import sys
import json
from datetime import datetime, timedelta

class PMSAPITester:
    def __init__(self, base_url="https://pmsdash-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_user = None
        self.test_project_id = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_init_admin(self):
        """Initialize admin user"""
        success, response = self.run_test(
            "Initialize Admin",
            "POST",
            "init-admin",
            200
        )
        return success

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@pms.com", "password": "Admin@123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.admin_user = response['user']
            print(f"   Token obtained for user: {self.admin_user['name']}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: {response.get('total_projects', 0)} projects, {response.get('pending_approvals', 0)} pending")
        return success

    def test_create_user(self):
        """Test user creation"""
        user_data = {
            "email": f"test_pm_{datetime.now().strftime('%H%M%S')}@pms.com",
            "password": "TestPass123!",
            "name": "Test Project Manager",
            "role": "project_manager",
            "phone": "+1234567890",
            "company": "Test Company"
        }
        success, response = self.run_test(
            "Create User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        if success:
            self.test_user_id = response.get('id')
            print(f"   Created user ID: {self.test_user_id}")
        return success

    def test_get_users(self):
        """Test get users list"""
        success, response = self.run_test(
            "Get Users List",
            "GET",
            "users",
            200
        )
        if success:
            print(f"   Found {len(response)} users")
        return success

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "name": f"Test Construction Project {datetime.now().strftime('%H%M%S')}",
            "client_id": self.admin_user['id'],
            "client_type": "B2B",
            "service_types": ["aluminum_fab", "steel_fab"],
            "approved_value": 150000.0,
            "start_date": datetime.now().strftime('%Y-%m-%d'),
            "end_date": (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
            "description": "Test project for aluminum and steel fabrication"
        }
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        if success:
            self.test_project_id = response.get('id')
            print(f"   Created project ID: {self.test_project_id}")
        return success

    def test_get_projects(self):
        """Test get projects list"""
        success, response = self.run_test(
            "Get Projects List",
            "GET",
            "projects",
            200
        )
        if success:
            print(f"   Found {len(response)} projects")
        return success

    def test_get_project_detail(self):
        """Test get project details"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False
        
        success, response = self.run_test(
            "Get Project Detail",
            "GET",
            f"projects/{self.test_project_id}",
            200
        )
        if success:
            print(f"   Project: {response.get('name')} - Status: {response.get('status')}")
        return success

    def test_create_task(self):
        """Test task creation"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        task_data = {
            "project_id": self.test_project_id,
            "name": "Design Phase",
            "description": "Initial design and planning",
            "start_date": datetime.now().strftime('%Y-%m-%d'),
            "end_date": (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
            "dependencies": [],
            "assigned_users": [self.admin_user['id']],
            "is_milestone": False
        }
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        if success:
            print(f"   Created task: {response.get('name')}")
        return success

    def test_get_tasks(self):
        """Test get tasks list"""
        success, response = self.run_test(
            "Get Tasks List",
            "GET",
            f"tasks?project_id={self.test_project_id}",
            200
        )
        if success:
            print(f"   Found {len(response)} tasks")
        return success

    def test_create_change_order(self):
        """Test change order creation"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        co_data = {
            "project_id": self.test_project_id,
            "description": "Additional steel reinforcement required",
            "change_type": "add_item",
            "value_impact": 15000.0
        }
        success, response = self.run_test(
            "Create Change Order",
            "POST",
            "change-orders",
            200,
            data=co_data
        )
        if success:
            print(f"   Created change order: {response.get('description')}")
        return success

    def test_get_change_orders(self):
        """Test get change orders"""
        success, response = self.run_test(
            "Get Change Orders",
            "GET",
            "change-orders",
            200
        )
        if success:
            print(f"   Found {len(response)} change orders")
        return success

    def test_create_financial_entry(self):
        """Test financial entry creation"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        entry_data = {
            "project_id": self.test_project_id,
            "entry_type": "invoice",
            "amount": 25000.0,
            "description": "Initial payment invoice"
        }
        success, response = self.run_test(
            "Create Financial Entry",
            "POST",
            "financial-entries",
            200,
            data=entry_data
        )
        if success:
            print(f"   Created financial entry: {response.get('description')}")
        return success

    def test_get_financial_entries(self):
        """Test get financial entries"""
        success, response = self.run_test(
            "Get Financial Entries",
            "GET",
            "financial-entries",
            200
        )
        if success:
            print(f"   Found {len(response)} financial entries")
        return success

    def test_create_progress_log(self):
        """Test progress log creation"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        # Use form data for progress log with photos
        form_data = {
            'project_id': self.test_project_id,
            'notes': 'Initial progress update - project kickoff completed',
            'progress_update': '10.0'
        }
        success, response = self.run_test(
            "Create Progress Log",
            "POST",
            "progress-logs",
            200,
            data=form_data
        )
        if success:
            print(f"   Created progress log: {response.get('notes')}")
        return success

    def test_get_progress_logs(self):
        """Test get progress logs"""
        success, response = self.run_test(
            "Get Progress Logs",
            "GET",
            "progress-logs",
            200
        )
        if success:
            print(f"   Found {len(response)} progress logs")
        return success

    def test_create_message(self):
        """Test message creation"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        message_data = {
            "project_id": self.test_project_id,
            "content": "Project kickoff meeting scheduled for next week"
        }
        success, response = self.run_test(
            "Create Message",
            "POST",
            "messages",
            200,
            data=message_data
        )
        if success:
            print(f"   Created message: {response.get('content')}")
        return success

    def test_get_messages(self):
        """Test get messages"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        success, response = self.run_test(
            "Get Messages",
            "GET",
            f"messages?project_id={self.test_project_id}",
            200
        )
        if success:
            print(f"   Found {len(response)} messages")
        return success

    def test_gantt_data(self):
        """Test Gantt chart data"""
        if not self.test_project_id:
            print("❌ Skipped - No test project ID")
            return False

        success, response = self.run_test(
            "Get Gantt Data",
            "GET",
            f"projects/{self.test_project_id}/gantt",
            200
        )
        if success:
            tasks = response.get('tasks', [])
            print(f"   Found {len(tasks)} tasks for Gantt chart")
        return success

    def test_recent_activities(self):
        """Test recent activities"""
        success, response = self.run_test(
            "Get Recent Activities",
            "GET",
            "dashboard/recent-activities",
            200
        )
        if success:
            print(f"   Found {len(response)} recent activities")
        return success

    def test_project_summary(self):
        """Test project summary"""
        success, response = self.run_test(
            "Get Project Summary",
            "GET",
            "dashboard/project-summary",
            200
        )
        if success:
            print(f"   Summary: {response.get('total', 0)} total projects")
        return success

def main():
    print("🚀 Starting PMS API Testing...")
    tester = PMSAPITester()

    # Core authentication tests
    if not tester.test_init_admin():
        print("❌ Admin initialization failed, continuing with existing admin...")
    
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    # Authentication endpoints
    tester.test_get_me()

    # Dashboard endpoints
    tester.test_dashboard_stats()
    tester.test_recent_activities()
    tester.test_project_summary()

    # User management
    tester.test_create_user()
    tester.test_get_users()

    # Project management
    tester.test_create_project()
    tester.test_get_projects()
    tester.test_get_project_detail()

    # Task management
    tester.test_create_task()
    tester.test_get_tasks()
    tester.test_gantt_data()

    # Change orders
    tester.test_create_change_order()
    tester.test_get_change_orders()

    # Financial management
    tester.test_create_financial_entry()
    tester.test_get_financial_entries()

    # Progress tracking
    tester.test_create_progress_log()
    tester.test_get_progress_logs()

    # Messaging
    tester.test_create_message()
    tester.test_get_messages()

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {len(tester.failed_tests)}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")

    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            if 'error' in failure:
                print(f"   - {failure['test']}: {failure['error']}")
            else:
                print(f"   - {failure['test']}: Expected {failure.get('expected')}, got {failure.get('actual')}")

    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())