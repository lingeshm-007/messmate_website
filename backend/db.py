"""
Database schema, connection management, and realistic seed data for MessMate.
"""
import sqlite3
import json
import os
from datetime import datetime, timedelta

def get_db_path():
    if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        return '/tmp/messmate.db'
    db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    try:
        os.makedirs(db_dir, exist_ok=True)
        test_file = os.path.join(db_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("1")
        os.remove(test_file)
        return os.path.join(db_dir, "messmate.db")
    except Exception:
        return "/tmp/messmate.db"

def get_db_connection():
    db_path = get_db_path()
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    
    first_time = not os.path.exists(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    if first_time:
        init_db(conn=conn)
        seed_demo_data(force=False, conn=conn)

    return conn

def init_db(conn=None):
    """Initializes tables and seeds initial data if empty."""
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS mess_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        mess_name TEXT NOT NULL DEFAULT 'Annapoorna Home Mess',
        owner_name TEXT NOT NULL DEFAULT 'Lakshmi Amma',
        phone TEXT NOT NULL DEFAULT '9845012345',
        address TEXT NOT NULL DEFAULT 'No. 14, College Road, Near PSG Tech, Coimbatore',
        capacity INTEGER NOT NULL DEFAULT 20,
        price_three_meals INTEGER NOT NULL DEFAULT 4000,
        price_two_meals INTEGER NOT NULL DEFAULT 3000,
        price_one_meal INTEGER NOT NULL DEFAULT 1800,
        price_breakfast INTEGER NOT NULL DEFAULT 1200,
        price_lunch INTEGER NOT NULL DEFAULT 1800,
        price_dinner INTEGER NOT NULL DEFAULT 1800,
        enable_breakfast INTEGER NOT NULL DEFAULT 1,
        enable_lunch INTEGER NOT NULL DEFAULT 1,
        enable_dinner INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        photo_url TEXT,
        joining_date TEXT NOT NULL,
        meal_selection TEXT NOT NULL, -- JSON array e.g. ["breakfast", "lunch", "dinner"]
        monthly_fee INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'inactive'
        discontinue_date TEXT,
        discontinue_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS billing_cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        cycle_number INTEGER NOT NULL DEFAULT 1,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        base_amount INTEGER NOT NULL,
        previous_pending INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed'
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS meal_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner'
        status TEXT NOT NULL, -- 'ate', 'missed'
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date, meal_type),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        billing_cycle_id INTEGER,
        amount INTEGER NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'UPI', -- 'Cash', 'UPI', 'Other'
        receipt_number TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
        FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        billing_cycle_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        deduction_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        missed_meal_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
        FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS weekly_menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week TEXT NOT NULL UNIQUE, -- 'Monday'..'Sunday'
        day_order INTEGER NOT NULL,
        breakfast_items TEXT NOT NULL,
        lunch_items TEXT NOT NULL,
        dinner_items TEXT NOT NULL,
        special_note TEXT
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        meals_skipped TEXT, -- JSON array
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # Check if mess_settings is populated
    cursor.execute("SELECT COUNT(*) FROM mess_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO mess_settings (
            id, mess_name, owner_name, phone, address, capacity,
            price_three_meals, price_two_meals, price_one_meal,
            price_breakfast, price_lunch, price_dinner,
            enable_breakfast, enable_lunch, enable_dinner
        ) VALUES (
            1, 'Annapoorna Home Mess', 'Lakshmi Amma', '9845012345',
            'No. 14, College Road, Near PSG Tech, Coimbatore', 20,
            4000, 3000, 1800,
            1200, 1800, 1800,
            1, 1, 1
        )
        """)

    conn.commit()
    if own_conn:
        conn.close()

def seed_demo_data(force=False, conn=None):
    """Populates realistic demo data including the complete Lingesh scenario and other students."""
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True
    cursor = conn.cursor()

    if not force:
        cursor.execute("SELECT COUNT(*) FROM students")
        if cursor.fetchone()[0] > 0:
            conn.close()
            return

    # Clear existing data if force reset
    cursor.executescript("""
    DELETE FROM leave_requests;
    DELETE FROM deductions;
    DELETE FROM payments;
    DELETE FROM meal_attendance;
    DELETE FROM billing_cycles;
    DELETE FROM students;
    DELETE FROM weekly_menu;
    """)

    # 1. Weekly Menu
    days_data = [
        ("Monday", 1, "Idli, Medu Vada, Sambar & Coconut Chutney", "Rice, Sambar, Rasam, Beetroot Poriyal, Curd, Appalam", "Chapathi with Paneer Butter Masala & Veg Pulao", "Special filter coffee included with breakfast"),
        ("Tuesday", 2, "Puri with Potato Masala & Kesari", "Rice, Mor Kuzhambu, Beans Carrot Poriyal, Rasam, Curd", "Dosa, Sambar, Tomato Chutney & Milagai Podi", "Hot herbal tea available in the evening"),
        ("Wednesday", 3, "Pongal, Vada, Chutney & Gothsu", "Rice, Karakuzhambu, Cabbage Poriyal, Rasam, Curd, Pickle", "Idiyappam with Coconut Milk & Veg Kurma", "Special South Indian traditional lunch"),
        ("Thursday", 4, "Rava Upma with Coconut Chutney & Banana", "Rice, Drumstick Sambar, Potato Fry, Rasam, Curd", "Parotta with Veg Salna & Onion Raitha", "Special sweet payasam for dinner"),
        ("Friday", 5, "Masala Dosa with Sambar & 2 Chutneys", "Special Lemon Rice / Curd Rice / Meals, Aviyal, Vadam", "Chapathi, Dal Fry, Jeera Rice & Aloo Gobi", "Traditional Friday special feast"),
        ("Saturday", 6, "Semiya Upma / Poha with Roasted Peanuts", "Rice, Poondu Kuzhambu, Keerai Kootu, Rasam, Curd", "Variety Rice: Tomato Rice & Vegetable Biryani", "Light dinner option"),
        ("Sunday", 7, "Aloo Paratha with Curd & Pickle", "Special Veg Biryani, Onion Raitha, Paneer Gravy, Ice Cream", "Soft Idli, Tiffin Sambar, Coriander Chutney", "Sunday special feast for students")
    ]
    for day, order, b_items, l_items, d_items, note in days_data:
        cursor.execute("""
        INSERT INTO weekly_menu (day_of_week, day_order, breakfast_items, lunch_items, dinner_items, special_note)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (day, order, b_items, l_items, d_items, note))

    # 2. Students List
    # Lingesh (Key Demo Scenario: Joined 18/07/2026, 3 meals, ₹4,000 plan, ₹2,000 paid, 6 missed meals, ₹300 deduction)
    # Arun (Joined 25/07/2026, Breakfast + Lunch, ₹3,000 plan)
    # Priya (Joined 01/08/2026, 3 meals, ₹4,000 plan, Fully paid)
    # Karthik (Joined 10/08/2026, Lunch + Dinner, ₹3,000 plan)
    # Divya (Joined 15/07/2026, 3 meals, ₹4,000 plan, Paused because went home)
    # Vignesh (Joined 01/06/2026, Discontinued on 15/08/2026 - Inactive)
    # Sanjay (Joined 05/08/2026, Breakfast + Dinner, ₹3,000 plan)

    students_data = [
        {
            "name": "Lingesh",
            "phone": "9876543210",
            "address": "Room 204, Green Nest Hostel, Coimbatore",
            "photo_url": "avatar_lingesh",
            "joining_date": "2026-07-18",
            "meal_selection": ["breakfast", "lunch", "dinner"],
            "monthly_fee": 4000,
            "status": "active",
            "notes": "Computer Science student, loves curd rice. Key demo student."
        },
        {
            "name": "Arun Kumar",
            "phone": "9843211223",
            "address": "Plot 5, Royal Avenue, Peelamedu, Coimbatore",
            "photo_url": "avatar_arun",
            "joining_date": "2026-07-25",
            "meal_selection": ["breakfast", "lunch"],
            "monthly_fee": 3000,
            "status": "active",
            "notes": "Only 2 meals (Breakfast + Lunch), has dinner at college project lab."
        },
        {
            "name": "Priya Sharma",
            "phone": "9789012345",
            "address": "Flat 3B, Sri Krishna Apartments, Gandhipuram",
            "photo_url": "avatar_priya",
            "joining_date": "2026-08-01",
            "meal_selection": ["breakfast", "lunch", "dinner"],
            "monthly_fee": 4000,
            "status": "active",
            "notes": "Prefers mild spice food. Always pays promptly on 1st of every month."
        },
        {
            "name": "Karthik Raja",
            "phone": "9944556677",
            "address": "Door 12, Bharathi Colony, Peelamedu",
            "photo_url": "avatar_karthik",
            "joining_date": "2026-08-10",
            "meal_selection": ["lunch", "dinner"],
            "monthly_fee": 3000,
            "status": "active",
            "notes": "Skips breakfast due to early morning tuition classes."
        },
        {
            "name": "Divya Natesan",
            "phone": "9894123456",
            "address": "Annamalai Nagar, Hopes College, Coimbatore",
            "photo_url": "avatar_divya",
            "joining_date": "2026-07-15",
            "meal_selection": ["breakfast", "lunch", "dinner"],
            "monthly_fee": 4000,
            "status": "paused",
            "notes": "Temporarily paused: went home for family function from Aug 22 to Sep 02."
        },
        {
            "name": "Vignesh Murugan",
            "phone": "9443219876",
            "address": "Old No 45, Nava India Road, Coimbatore",
            "photo_url": "avatar_vignesh",
            "joining_date": "2026-06-01",
            "meal_selection": ["breakfast", "lunch", "dinner"],
            "monthly_fee": 4000,
            "status": "inactive",
            "discontinue_date": "2026-08-15",
            "discontinue_reason": "Semester finished and moved back to home town (Salem).",
            "notes": "Graduated student. Account preserved with all historical records."
        },
        {
            "name": "Sanjay Raghav",
            "phone": "9751234890",
            "address": "Room 102, Shanti Ladies & Gents PG, Coimbatore",
            "photo_url": "avatar_sanjay",
            "joining_date": "2026-08-05",
            "meal_selection": ["breakfast", "dinner"],
            "monthly_fee": 3000,
            "status": "active",
            "notes": "Takes lunch at college canteen. Breakfast & Dinner with MessMate."
        }
    ]

    student_id_map = {}
    for s in students_data:
        cursor.execute("""
        INSERT INTO students (name, phone, address, photo_url, joining_date, meal_selection, monthly_fee, status, discontinue_date, discontinue_reason, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["name"], s["phone"], s["address"], s["photo_url"], s["joining_date"],
            json.dumps(s["meal_selection"]), s["monthly_fee"], s["status"],
            s.get("discontinue_date"), s.get("discontinue_reason"), s.get("notes")
        ))
        student_id_map[s["name"]] = cursor.lastrowid

    # 3. Setup Billing Cycles & Transactions

    # -- LINGESH (Exact Demo Scenario) --
    # Joined 18/07/2026.
    # Cycle 1: 18/07/2026 -> 17/08/2026. Base: 4000.
    # Paid: ₹2,000 on 19/07/2026 (UPI).
    # Missed 6 meals during cycle 1.
    # Admin manual deduction: ₹300 on 10/08/2026 ("Missed 6 meals").
    # Adjusted bill: 4000 - 300 = 3700. Paid: 2000. Pending: 1700.
    #
    # Cycle 2: 18/08/2026 -> 17/09/2026 (Active cycle). Base: 4000.
    # Previous Pending carry-forward: ₹1,700.
    # Total Outstanding: 1700 + 4000 = 5700.
    # If he pays ₹2,000 on 20/08/2026 -> Pending: ₹3,700.

    lingesh_id = student_id_map["Lingesh"]
    
    # Cycle 1
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (lingesh_id, 1, "2026-07-18", "2026-08-17", 4000, 0, "closed", "First billing cycle"))
    lingesh_cycle1_id = cursor.lastrowid

    # Lingesh Payment 1 on 19/07/2026
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (lingesh_id, lingesh_cycle1_id, 2000, "2026-07-19", "UPI", "REC-20260719-01", "Initial 50% partial payment via GPay"))

    # Lingesh Deduction on 10/08/2026
    cursor.execute("""
    INSERT INTO deductions (student_id, billing_cycle_id, amount, deduction_date, reason, missed_meal_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (lingesh_id, lingesh_cycle1_id, 300, "2026-08-10", "Missed 6 meals during college symposium week", 6, "Owner approved ₹300 discount"))

    # Cycle 2 (Current active cycle)
    # Remaining from cycle 1 was 4000 - 300 - 2000 = 1700
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (lingesh_id, 2, "2026-08-18", "2026-09-17", 4000, 1700, "active", "Second billing cycle with carry-forward balance"))
    lingesh_cycle2_id = cursor.lastrowid

    # Lingesh payment in cycle 2
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (lingesh_id, lingesh_cycle2_id, 2000, "2026-08-20", "UPI", "REC-20260820-04", "Partial payment against carry forward + new cycle"))

    # -- ARUN (Joined 25/07/2026, 2 meals, ₹3000) --
    arun_id = student_id_map["Arun Kumar"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (arun_id, 1, "2026-07-25", "2026-08-24", 3000, 0, "closed", "First billing cycle"))
    arun_cycle1_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (arun_id, arun_cycle1_id, 3000, "2026-07-26", "Cash", "REC-20260726-02", "Full payment in cash"))

    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (arun_id, 2, "2026-08-25", "2026-09-24", 3000, 0, "active", "Current active cycle"))

    # -- PRIYA (Joined 01/08/2026, ₹4000) --
    priya_id = student_id_map["Priya Sharma"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (priya_id, 1, "2026-08-01", "2026-08-31", 4000, 0, "active", "First month bill"))
    priya_cycle1_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (priya_id, priya_cycle1_id, 4000, "2026-08-02", "UPI", "REC-20260802-01", "Full advance payment via PhonePe"))

    # -- KARTHIK (Joined 10/08/2026, ₹3000) --
    karthik_id = student_id_map["Karthik Raja"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (karthik_id, 1, "2026-08-10", "2026-09-09", 3000, 0, "active", "First month bill"))
    karthik_cycle1_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (karthik_id, karthik_cycle1_id, 1500, "2026-08-12", "Cash", "REC-20260812-01", "50% advance payment in cash"))

    # -- DIVYA (Joined 15/07/2026, ₹4000, Paused) --
    divya_id = student_id_map["Divya Natesan"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (divya_id, 1, "2026-07-15", "2026-08-14", 4000, 0, "closed", "First month bill"))
    divya_cycle1_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (divya_id, divya_cycle1_id, 4000, "2026-07-16", "UPI", "REC-20260716-01", "Paid full"))

    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (divya_id, 2, "2026-08-15", "2026-09-14", 4000, 0, "active", "Paused cycle"))
    divya_cycle2_id = cursor.lastrowid
    # Deduction for 10 days paused
    cursor.execute("""
    INSERT INTO deductions (student_id, billing_cycle_id, amount, deduction_date, reason, missed_meal_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (divya_id, divya_cycle2_id, 1200, "2026-08-25", "Home leave adjustment (Aug 22 - Aug 31)", 30, "Planned absence credited"))

    # -- VIGNESH (Discontinued) --
    vignesh_id = student_id_map["Vignesh Murugan"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (vignesh_id, 1, "2026-06-01", "2026-06-30", 4000, 0, "closed", "June cycle"))
    v_c1 = cursor.lastrowid
    cursor.execute("INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number) VALUES (?, ?, 4000, '2026-06-02', 'UPI', 'REC-20260602-01')", (vignesh_id, v_c1))

    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (vignesh_id, 2, "2026-07-01", "2026-07-31", 4000, 0, "closed", "July cycle"))
    v_c2 = cursor.lastrowid
    cursor.execute("INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number) VALUES (?, ?, 4000, '2026-07-03', 'UPI', 'REC-20260703-01')", (vignesh_id, v_c2))

    # -- SANJAY (Joined 05/08/2026, ₹3000) --
    sanjay_id = student_id_map["Sanjay Raghav"]
    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (sanjay_id, 1, "2026-08-05", "2026-09-04", 3000, 0, "active", "August cycle"))
    sanjay_cycle1_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (sanjay_id, sanjay_cycle1_id, 2000, "2026-08-06", "UPI", "REC-20260806-03", "Partial payment"))

    # 4. Generate Realistic Daily Meal Attendance
    # Today reference: 2026-08-30
    today = datetime(2026, 8, 30).date()
    start_date = datetime(2026, 7, 18).date()

    # Specific missed meals for Lingesh in Cycle 1 (Total 6 missed meals):
    # e.g.:
    # 2026-08-02: Breakfast (missed), Lunch (missed)
    # 2026-08-03: Lunch (missed), Dinner (missed)
    # 2026-08-05: Breakfast (missed)
    # 2026-08-07: Lunch (missed)
    # -> Breakfast: 2, Lunch: 3, Dinner: 1 => Total: 6 missed meals!
    lingesh_missed_set = {
        ("2026-08-02", "breakfast"),
        ("2026-08-02", "lunch"),
        ("2026-08-03", "lunch"),
        ("2026-08-03", "dinner"),
        ("2026-08-05", "breakfast"),
        ("2026-08-07", "lunch"),
        # In cycle 2, he missed 1 breakfast:
        ("2026-08-25", "breakfast")
    }

    curr = start_date
    while curr <= today:
        date_str = curr.strftime("%Y-%m-%d")
        day_name = curr.strftime("%A")

        for s in students_data:
            s_id = student_id_map[s["name"]]
            s_join = datetime.strptime(s["joining_date"], "%Y-%m-%d").date()
            if curr < s_join:
                continue
            
            # If discontinued
            if s.get("discontinue_date") and curr > datetime.strptime(s["discontinue_date"], "%Y-%m-%d").date():
                continue

            # If Divya paused (Aug 22 - Aug 30)
            if s["name"] == "Divya Natesan" and curr >= datetime(2026, 8, 22).date():
                for meal in s["meal_selection"]:
                    cursor.execute("""
                    INSERT OR IGNORE INTO meal_attendance (student_id, date, meal_type, status)
                    VALUES (?, ?, ?, 'missed')
                    """, (s_id, date_str, meal))
                continue

            for meal in s["meal_selection"]:
                status = "ate"
                if s["name"] == "Lingesh":
                    if (date_str, meal) in lingesh_missed_set:
                        status = "missed"
                elif s["name"] == "Arun Kumar":
                    if day_name == "Sunday" and meal == "breakfast" and curr.day % 2 == 0:
                        status = "missed"
                elif s["name"] == "Karthik Raja":
                    if date_str == "2026-08-22" and meal == "dinner":
                        status = "missed"
                elif s["name"] == "Sanjay Raghav":
                    if date_str == "2026-08-15" and meal == "dinner":
                        status = "missed"

                cursor.execute("""
                INSERT OR IGNORE INTO meal_attendance (student_id, date, meal_type, status)
                VALUES (?, ?, ?, ?)
                """, (s_id, date_str, meal, status))

        curr += timedelta(days=1)

    # 5. Leave Request demo
    cursor.execute("""
    INSERT INTO leave_requests (student_id, start_date, end_date, meals_skipped, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        divya_id, "2026-08-22", "2026-09-02",
        json.dumps(["breakfast", "lunch", "dinner"]),
        "Cousin wedding at native village (Salem)", "approved"
    ))

    cursor.execute("""
    INSERT INTO leave_requests (student_id, start_date, end_date, meals_skipped, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        lingesh_id, "2026-09-05", "2026-09-06",
        json.dumps(["dinner"]),
        "College cultural fest organizing team duty", "pending"
    ))

    conn.commit()
    if own_conn:
        conn.close()
    print("MessMate database seeded successfully with realistic demo data!")

if __name__ == "__main__":
    init_db()
    seed_demo_data(force=True)
