"""
End-to-End API and Handler Verification Script.
Simulates HTTP GET/POST/PUT requests against MessMateRequestHandler directly.
"""
import io
import json
import unittest
from backend.server import MessMateRequestHandler
from backend.db import init_db, seed_demo_data

class DummySocket:
    def __init__(self, request_bytes):
        self.rfile = io.BytesIO(request_bytes)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        return self.wfile

    def sendall(self, data):
        self.wfile.write(data)

def simulate_request(method, path, body=None):
    body_bytes = json.dumps(body).encode('utf-8') if body else b''
    raw_req = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(body_bytes)}\r\n\r\n".encode('utf-8') + body_bytes
    
    sock = DummySocket(raw_req)
    
    class FakeServer:
        pass

    try:
        handler = MessMateRequestHandler(sock, ("127.0.0.1", 8000), FakeServer())
    except Exception:
        pass

    response_data = sock.wfile.getvalue().decode('utf-8', errors='ignore')
    status_line = response_data.split("\r\n")[0] if response_data else ""
    
    body_part = ""
    if "\r\n\r\n" in response_data:
        body_part = response_data.split("\r\n\r\n", 1)[1]
    
    try:
        json_resp = json.loads(body_part) if body_part else None
    except Exception:
        json_resp = body_part

    return status_line, json_resp

class TestApiEndpoints(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_demo_data(force=True)

    def test_health_endpoint(self):
        status, body = simulate_request("GET", "/api/health")
        self.assertIn("200", status)
        self.assertEqual(body.get("status"), "ok")

    def test_dashboard_endpoint(self):
        status, body = simulate_request("GET", "/api/dashboard?date=2026-08-30")
        self.assertIn("200", status)
        self.assertIn("students", body)
        self.assertIn("today_attendance", body)
        self.assertIn("financial_summary", body)

    def test_students_and_lingesh_profile(self):
        status, students = simulate_request("GET", "/api/students")
        self.assertIn("200", status)
        self.assertGreaterEqual(len(students), 6)
        
        lingesh = next((s for s in students if s["name"] == "Lingesh"), None)
        self.assertIsNotNone(lingesh)
        
        status, profile = simulate_request("GET", f"/api/students/{lingesh['id']}")
        self.assertIn("200", status)
        self.assertEqual(profile["student"]["name"], "Lingesh")
        self.assertGreaterEqual(len(profile["cycles"]), 2)

    def test_ai_prediction_endpoint(self):
        status, pred = simulate_request("GET", "/api/ai/prediction?date=2026-08-31")
        self.assertIn("200", status)
        self.assertIn("predicted_headcount", pred)
        self.assertIn("highlight_message", pred)

    def test_multi_field_search(self):
        # 1. Search by name
        status, res_name = simulate_request("GET", "/api/students?search=lingesh")
        self.assertEqual(len(res_name), 1)
        self.assertEqual(res_name[0]["name"], "Lingesh")

        # 2. Search by partial phone number
        status, res_phone = simulate_request("GET", "/api/students?search=9876")
        self.assertTrue(any(s["name"] == "Lingesh" for s in res_phone))

        # 3. Search by address
        status, res_addr = simulate_request("GET", "/api/students?search=Coimbatore")
        self.assertGreater(len(res_addr), 0)

        # 4. Search by status
        status, res_status = simulate_request("GET", "/api/students?search=paused")
        self.assertTrue(any(s["name"] == "Divya Natesan" for s in res_status))

        # 5. Search by ID
        status, res_id = simulate_request("GET", "/api/students?search=1")
        self.assertGreater(len(res_id), 0)

    def test_record_payment_and_receipt(self):
        status, students = simulate_request("GET", "/api/students")
        lingesh = next(s for s in students if s["name"] == "Lingesh")
        
        # Record payment of ₹500
        status, res = simulate_request("POST", "/api/payments", {
            "student_id": lingesh["id"],
            "amount": 500,
            "payment_date": "2026-08-30",
            "payment_method": "UPI",
            "notes": "Test payment verification"
        })
        self.assertIn("200", status)
        self.assertTrue(res.get("success"))
        
        # Fetch receipt
        status, receipt = simulate_request("GET", f"/api/payments/{res['payment_id']}/receipt")
        self.assertIn("200", status)
        self.assertEqual(receipt["amount"], 500)
        self.assertEqual(receipt["student_name"], "Lingesh")

if __name__ == "__main__":
    unittest.main()
