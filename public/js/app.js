/**
 * Main MessMate Application Controller
 * Orchestrates routing, state management, API calls, and interactive modals.
 */

window.MessMateApp = {
  state: {
    currentPage: 'dashboard',
    userRole: 'admin', // 'admin' | 'student'
    selectedDate: new Date().toISOString().split('T')[0],
    selectedStudentId: null,
    viewingStudentId: null,
    profileTab: 'overview',
    studentFilter: 'all',
    studentSearch: '',
    messSettings: null,
    studentsList: [],
    dashboardData: null,
    attendanceData: null,
    currentStudentProfile: null,
    menuData: [],
    reportsData: null,
    aiForecastData: null,
    paymentsData: [],
    deductionsData: [],
    activeModal: null
  },

  async init() {
    try {
      await this.loadInitialSettings();
      await this.loadStudentsList();
      
      // Auto-select Lingesh as default student if present
      const lingesh = this.state.studentsList.find(s => s.name === 'Lingesh');
      if (lingesh) {
        this.state.selectedStudentId = lingesh.id;
      } else if (this.state.studentsList.length > 0) {
        this.state.selectedStudentId = this.state.studentsList[0].id;
      }

      await this.renderCurrentPage();
    } catch (err) {
      console.error("Initialization error:", err);
      this.showToast("Error loading application: " + err.message, "error");
    }
  },

  // -------------------------------------------------------------
  // DATA LOADERS
  // -------------------------------------------------------------
  async loadInitialSettings() {
    this.state.messSettings = await MessMateAPI.getSettings();
  },

  async loadStudentsList() {
    this.state.studentsList = await MessMateAPI.getStudents();
  },

  // -------------------------------------------------------------
  // ROUTING & ROLE SWITCHING
  // -------------------------------------------------------------
  setRole(role) {
    this.state.userRole = role;
    if (role === 'student') {
      this.state.currentPage = 'student_portal';
    } else {
      if (this.state.currentPage === 'student_portal') {
        this.state.currentPage = 'dashboard';
      }
    }
    this.renderCurrentPage();
  },

  switchStudent(studentId) {
    this.state.selectedStudentId = parseInt(studentId);
    this.renderCurrentPage();
  },

  async navigateTo(page, params = {}) {
    this.state.currentPage = page;
    if (params.studentId) {
      this.state.viewingStudentId = params.studentId;
    }
    await this.renderCurrentPage();
  },

  async renderCurrentPage() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Render Top Navbar
    const navbarHtml = window.MessMateNavbar.render(this.state);
    
    let contentHtml = '';

    try {
      if (this.state.userRole === 'student') {
        const studentId = this.state.selectedStudentId || (this.state.studentsList[0] ? this.state.studentsList[0].id : null);
        if (studentId) {
          const profile = await MessMateAPI.getStudent(studentId);
          const menu = await MessMateAPI.getMenu();
          contentHtml = window.MessMateStudentView.render(profile, menu, this.state);
        } else {
          contentHtml = `<div class="p-12 text-center text-stone-500">No student profile selected.</div>`;
        }
      } else {
        // Admin Pages
        switch (this.state.currentPage) {
          case 'dashboard':
            this.state.dashboardData = await MessMateAPI.getDashboard(this.state.selectedDate);
            contentHtml = window.MessMateDashboard.render(this.state.dashboardData, this.state);
            break;

          case 'attendance':
            this.state.attendanceData = await MessMateAPI.getAttendance(this.state.selectedDate);
            contentHtml = window.MessMateAttendance.render(this.state.attendanceData, this.state);
            break;

          case 'students':
            this.state.studentsList = await MessMateAPI.getStudents();
            contentHtml = window.MessMateStudents.render(this.state.studentsList, this.state);
            break;

          case 'profile':
            if (this.state.viewingStudentId) {
              const profile = await MessMateAPI.getStudent(this.state.viewingStudentId);
              contentHtml = window.MessMateProfile.render(profile, this.state);
            } else {
              contentHtml = `<div class="p-12 text-center text-stone-500">Select a student to view profile.</div>`;
            }
            break;

          case 'billing':
            const billingStudents = await MessMateAPI.getStudents();
            contentHtml = window.MessMateBilling.render(billingStudents, this.state);
            break;

          case 'payments':
            const payments = await MessMateAPI.getPayments();
            contentHtml = window.MessMatePayments.render(payments, this.state);
            break;

          case 'menu':
            const menu = await MessMateAPI.getMenu();
            contentHtml = window.MessMateMenu.render(menu, this.state);
            break;

          case 'ai_demand':
            const aiData = await MessMateAPI.getAiPrediction();
            contentHtml = window.MessMateAiDemand.render(aiData, this.state);
            break;

          case 'reports':
            const reports = await MessMateAPI.getReports();
            contentHtml = window.MessMateReports.render(reports, this.state);
            break;

          case 'settings':
            this.state.messSettings = await MessMateAPI.getSettings();
            contentHtml = window.MessMateSettings.render(this.state.messSettings, this.state);
            break;

          default:
            contentHtml = window.MessMateDashboard.render(this.state.dashboardData, this.state);
            break;
        }
      }
    } catch (err) {
      console.error("Render error:", err);
      contentHtml = `<div class="p-8 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">Error loading view: ${err.message}</div>`;
    }

    root.innerHTML = `
      ${navbarHtml}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        ${contentHtml}
      </main>
    `;
  },

  // -------------------------------------------------------------
  // ATTENDANCE ACTIONS
  // -------------------------------------------------------------
  async setAttendanceDate(newDate) {
    this.state.selectedDate = newDate;
    await this.renderCurrentPage();
  },

  async changeAttendanceDate(deltaDays) {
    const current = new Date(this.state.selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + deltaDays);
    this.state.selectedDate = current.toISOString().split('T')[0];
    await this.renderCurrentPage();
  },

  async markAttendance(studentId, date, mealType, status) {
    try {
      await MessMateAPI.markAttendance(studentId, date, mealType, status);
      // Fast optimistic update in UI without full reload if on attendance page
      this.state.attendanceData = await MessMateAPI.getAttendance(this.state.selectedDate);
      await this.renderCurrentPage();
      this.showToast(`Marked ${mealType} as ${status.toUpperCase()}`, "success");
    } catch (err) {
      this.showToast("Failed to mark attendance: " + err.message, "error");
    }
  },

  async bulkMarkAttendance(date, mealType, status = 'ate') {
    try {
      await MessMateAPI.bulkAttendance(date, mealType, status);
      this.showToast(`Marked all active students as ${status.toUpperCase()} for ${mealType || 'all meals'}`, "success");
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Bulk attendance error: " + err.message, "error");
    }
  },

  // -------------------------------------------------------------
  // STUDENT MANAGEMENT & LIVE SEARCH ACTIONS
  // -------------------------------------------------------------
  handleStudentSearchInput(query) {
    this.state.studentSearch = query;

    // Toggle clear button
    const clearBtn = document.getElementById('student-search-clear-btn');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !query);
    }

    // Filter students array in memory
    const filtered = window.MessMateStudents.filterStudents(
      this.state.studentsList,
      query,
      this.state.studentFilter
    );

    // Update results container directly without remounting search input
    const container = document.getElementById('students-cards-container');
    if (container) {
      container.innerHTML = window.MessMateStudents.renderCardsHtml(filtered);
    }

    // Update feedback bar
    const feedbackBar = document.getElementById('search-feedback-bar');
    const queryDisplay = document.getElementById('search-query-display');
    const resultCount = document.getElementById('search-result-count');
    if (feedbackBar && queryDisplay && resultCount) {
      if (query && query.trim()) {
        feedbackBar.classList.remove('hidden');
        queryDisplay.textContent = `"${query}"`;
        resultCount.textContent = filtered.length;
      } else {
        feedbackBar.classList.add('hidden');
      }
    }
  },

  clearStudentSearch() {
    this.state.studentSearch = '';
    const input = document.getElementById('student-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }

    const clearBtn = document.getElementById('student-search-clear-btn');
    if (clearBtn) {
      clearBtn.classList.add('hidden');
    }

    const feedbackBar = document.getElementById('search-feedback-bar');
    if (feedbackBar) {
      feedbackBar.classList.add('hidden');
    }

    // Refresh grid container with all students for current filter
    const filtered = window.MessMateStudents.filterStudents(
      this.state.studentsList,
      '',
      this.state.studentFilter
    );
    const container = document.getElementById('students-cards-container');
    if (container) {
      container.innerHTML = window.MessMateStudents.renderCardsHtml(filtered);
    }
  },

  filterStudentsStatus(filter) {
    this.state.studentFilter = filter;

    const tabsContainer = document.getElementById('student-filter-tabs');
    const cardsContainer = document.getElementById('students-cards-container');

    if (tabsContainer && cardsContainer) {
      // Direct DOM update of tabs and cards to preserve input focus if active
      const buttons = tabsContainer.querySelectorAll('button');
      const filterStyles = {
        'all': 'bg-stone-900 text-white',
        'active': 'bg-emerald-700 text-white',
        'paused': 'bg-amber-600 text-white',
        'inactive': 'bg-rose-700 text-white',
        'pending': 'bg-orange-600 text-white'
      };

      buttons.forEach(btn => {
        btn.className = 'px-3 py-2 rounded-lg transition whitespace-nowrap bg-stone-100 text-stone-600 hover:bg-stone-200';
      });

      const activeBtn = Array.from(buttons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${filter}'`));
      if (activeBtn) {
        activeBtn.className = `px-3 py-2 rounded-lg transition whitespace-nowrap ${filterStyles[filter] || 'bg-stone-900 text-white'}`;
      }

      const filtered = window.MessMateStudents.filterStudents(
        this.state.studentsList,
        this.state.studentSearch,
        filter
      );
      cardsContainer.innerHTML = window.MessMateStudents.renderCardsHtml(filtered);

      const resultCount = document.getElementById('search-result-count');
      if (resultCount) {
        resultCount.textContent = filtered.length;
      }
    } else {
      this.renderCurrentPage();
    }
  },

  viewStudentProfile(studentId) {
    this.state.viewingStudentId = studentId;
    this.state.profileTab = 'overview';
    this.navigateTo('profile');
  },

  viewStudentProfileByName(name) {
    const student = this.state.studentsList.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    if (student) {
      this.viewStudentProfile(student.id);
    } else {
      this.showToast(`Student ${name} not found`, "error");
    }
  },

  setProfileTab(tab) {
    this.state.profileTab = tab;
    this.renderCurrentPage();
  },

  // -------------------------------------------------------------
  // BILLING & CYCLES ACTIONS
  // -------------------------------------------------------------
  async startNextBillingCycle(studentId) {
    this.confirmDialog(
      "Start Next Billing Cycle?",
      "This will close the current billing cycle and automatically carry forward any remaining balance into the new month's cycle based on the student's joining date.",
      async () => {
        try {
          const res = await MessMateAPI.startNextCycle(studentId);
          this.showToast(`New billing cycle #${res.new_cycle.cycle_number} started! Carried forward: ₹${res.new_cycle.previous_pending}`, "success");
          await this.loadStudentsList();
          await this.renderCurrentPage();
        } catch (err) {
          this.showToast("Failed to start next cycle: " + err.message, "error");
        }
      }
    );
  },

  // -------------------------------------------------------------
  // SETTINGS & MENU SAVING
  // -------------------------------------------------------------
  async saveSettings() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = {
      mess_name: formData.get('mess_name'),
      owner_name: formData.get('owner_name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      capacity: parseInt(formData.get('capacity') || 20),
      price_three_meals: parseInt(formData.get('price_three_meals') || 4000),
      price_two_meals: parseInt(formData.get('price_two_meals') || 3000),
      price_one_meal: parseInt(formData.get('price_one_meal') || 1800),
      enable_breakfast: formData.get('enable_breakfast') === 'on',
      enable_lunch: formData.get('enable_lunch') === 'on',
      enable_dinner: formData.get('enable_dinner') === 'on'
    };

    try {
      this.state.messSettings = await MessMateAPI.updateSettings(data);
      this.showToast("Mess settings and pricing updated successfully!", "success");
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to save settings: " + err.message, "error");
    }
  },

  async saveMenu() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const updates = days.map(day => ({
      day_of_week: day,
      breakfast_items: (document.getElementById(`menu-b-${day}`) || {}).value || '',
      lunch_items: (document.getElementById(`menu-l-${day}`) || {}).value || '',
      dinner_items: (document.getElementById(`menu-d-${day}`) || {}).value || '',
      special_note: (document.getElementById(`menu-note-${day}`) || {}).value || ''
    }));

    try {
      await MessMateAPI.updateMenu(updates);
      this.showToast("Weekly menu saved successfully!", "success");
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to save menu: " + err.message, "error");
    }
  },

  async loadAiForecast(date) {
    try {
      const aiData = await MessMateAPI.getAiPrediction(date);
      const root = document.getElementById('app-root');
      if (root && this.state.currentPage === 'ai_demand') {
        const navbarHtml = window.MessMateNavbar.render(this.state);
        const contentHtml = window.MessMateAiDemand.render(aiData, this.state);
        root.innerHTML = `${navbarHtml}<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">${contentHtml}</main>`;
      }
    } catch (err) {
      this.showToast("Failed to load forecast: " + err.message, "error");
    }
  },

  // -------------------------------------------------------------
  // MODALS
  // -------------------------------------------------------------
  closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
      modalContainer.classList.add('hidden');
    }
  },

  openAddStudentModal() {
    const s = this.state.messSettings || { price_three_meals: 4000, price_two_meals: 3000, price_one_meal: 1800 };
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 class="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <span>➕</span>
              <span>Register New Student</span>
            </h2>
            <button onclick="MessMateApp.closeModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
          </div>

          <form id="add-student-form" onsubmit="event.preventDefault(); MessMateApp.submitAddStudent();" class="space-y-4 text-xs">
            
            <!-- Preset Avatar Selection -->
            <div>
              <label class="block font-bold text-stone-700 mb-1.5">Choose Avatar / Photo</label>
              <div class="flex items-center space-x-2 overflow-x-auto pb-2">
                ${Object.keys(window.MessMateAvatars.presets).map((key, idx) => `
                  <label class="cursor-pointer">
                    <input type="radio" name="photo_url" value="${key}" ${idx === 0 ? 'checked' : ''} class="sr-only peer">
                    <div class="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-orange-600 peer-checked:scale-110 transition overflow-hidden">
                      ${window.MessMateAvatars.presets[key].svg}
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-stone-700 mb-1">Full Name *</label>
                <input type="text" name="name" required placeholder="e.g. Lingesh" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 font-semibold" />
              </div>

              <div>
                <label class="block font-bold text-stone-700 mb-1">Phone Number *</label>
                <input type="tel" name="phone" required placeholder="9876543210" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 font-semibold" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-stone-700 mb-1">Address / Hostel Room</label>
                <input type="text" name="address" placeholder="Room 204, Green Nest Hostel" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500" />
              </div>

              <div>
                <label class="block font-bold text-stone-700 mb-1">Joining Date *</label>
                <input type="date" name="joining_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 font-bold" />
              </div>
            </div>

            <!-- Meal Selection (Any combination) -->
            <div class="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200 space-y-2">
              <label class="block font-bold text-orange-950">Meal Selection (Any combination)</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center space-x-2 bg-white p-2 rounded-lg border border-orange-100 cursor-pointer">
                  <input type="checkbox" name="meal_breakfast" checked onchange="MessMateApp.recalculateAddStudentFee()" class="w-4 h-4 text-orange-600 rounded">
                  <span class="font-bold text-stone-800 text-[11px]">🥞 Breakfast</span>
                </label>
                <label class="flex items-center space-x-2 bg-white p-2 rounded-lg border border-orange-100 cursor-pointer">
                  <input type="checkbox" name="meal_lunch" checked onchange="MessMateApp.recalculateAddStudentFee()" class="w-4 h-4 text-orange-600 rounded">
                  <span class="font-bold text-stone-800 text-[11px]">🍛 Lunch</span>
                </label>
                <label class="flex items-center space-x-2 bg-white p-2 rounded-lg border border-orange-100 cursor-pointer">
                  <input type="checkbox" name="meal_dinner" checked onchange="MessMateApp.recalculateAddStudentFee()" class="w-4 h-4 text-orange-600 rounded">
                  <span class="font-bold text-stone-800 text-[11px]">🍲 Dinner</span>
                </label>
              </div>
            </div>

            <!-- Monthly Fee -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-stone-700">Monthly Plan Fee (₹)</label>
                <span class="text-[10px] text-stone-400">Auto-filled based on pricing setting</span>
              </div>
              <input type="number" id="new-student-fee" name="monthly_fee" value="${s.price_three_meals}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 font-extrabold text-stone-900 text-sm" />
            </div>

            <!-- Notes -->
            <div>
              <label class="block font-bold text-stone-700 mb-1">Notes / Preferences</label>
              <input type="text" name="notes" placeholder="e.g. Vegetarian, Computer science dept, prefers mild spice" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500" />
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button type="button" onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition">
                Save & Activate Student ✓
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');
  },

  recalculateAddStudentFee() {
    const form = document.getElementById('add-student-form');
    if (!form) return;
    const b = form.meal_breakfast.checked;
    const l = form.meal_lunch.checked;
    const d = form.meal_dinner.checked;
    const count = (b ? 1 : 0) + (l ? 1 : 0) + (d ? 1 : 0);
    const s = this.state.messSettings || { price_three_meals: 4000, price_two_meals: 3000, price_one_meal: 1800 };

    let fee = s.price_one_meal;
    if (count >= 3) fee = s.price_three_meals;
    else if (count === 2) fee = s.price_two_meals;
    else if (count === 0) fee = 0;

    const feeInput = document.getElementById('new-student-fee');
    if (feeInput) feeInput.value = fee;
  },

  async submitAddStudent() {
    const form = document.getElementById('add-student-form');
    if (!form) return;
    const formData = new FormData(form);

    const meals = [];
    if (formData.get('meal_breakfast') === 'on') meals.push('breakfast');
    if (formData.get('meal_lunch') === 'on') meals.push('lunch');
    if (formData.get('meal_dinner') === 'on') meals.push('dinner');

    if (meals.length === 0) {
      this.showToast("Please select at least one meal", "error");
      return;
    }

    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address') || '',
      joining_date: formData.get('joining_date'),
      photo_url: formData.get('photo_url') || 'default_avatar',
      meal_selection: meals,
      monthly_fee: parseInt(formData.get('monthly_fee') || 4000),
      notes: formData.get('notes') || ''
    };

    try {
      const student = await MessMateAPI.createStudent(data);
      this.closeModal();
      this.showToast(`Student ${student.student.name} registered successfully!`, "success");
      await this.loadStudentsList();
      this.viewStudentProfile(student.student.id);
    } catch (err) {
      this.showToast("Failed to register student: " + err.message, "error");
    }
  },

  openRecordPaymentModal(studentId = null, cycleId = null) {
    const students = this.state.studentsList.filter(s => s.status !== 'inactive');
    const defaultStudentId = studentId || (students[0] ? students[0].id : null);
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 class="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <span>💰</span>
              <span>Record Student Payment</span>
            </h2>
            <button onclick="MessMateApp.closeModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
          </div>

          <form id="record-payment-form" onsubmit="event.preventDefault(); MessMateApp.submitRecordPayment();" class="space-y-4 text-xs">
            
            <div>
              <label class="block font-bold text-stone-700 mb-1">Select Student *</label>
              <select name="student_id" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-blue-500 font-bold">
                ${students.map(s => `
                  <option value="${s.id}" ${s.id === defaultStudentId ? 'selected' : ''}>
                    ${s.name} (Pending: ₹${s.billing ? s.billing.current_pending : 0})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-stone-700 mb-1">Amount Paid (₹) *</label>
                <input type="number" name="amount" min="1" required placeholder="e.g. 2000" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-blue-500 font-black text-emerald-700 text-base" />
              </div>

              <div>
                <label class="block font-bold text-stone-700 mb-1">Payment Date *</label>
                <input type="date" name="payment_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-blue-500 font-bold" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Payment Method *</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center justify-center p-2.5 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer">
                  <input type="radio" name="payment_method" value="UPI" checked class="mr-1.5 text-purple-600">
                  <span class="font-bold text-purple-900">UPI (GPay/PhonePe)</span>
                </label>
                <label class="flex items-center justify-center p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer">
                  <input type="radio" name="payment_method" value="Cash" class="mr-1.5 text-emerald-600">
                  <span class="font-bold text-emerald-900">Cash</span>
                </label>
                <label class="flex items-center justify-center p-2.5 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer">
                  <input type="radio" name="payment_method" value="Other" class="mr-1.5 text-stone-600">
                  <span class="font-bold text-stone-800">Other</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Notes / Transaction Reference</label>
              <input type="text" name="notes" placeholder="e.g. Partial payment, Advance installment" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-blue-500" />
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button type="button" onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition">
                Save & Issue Receipt ✓
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');
  },

  async submitRecordPayment() {
    const form = document.getElementById('record-payment-form');
    if (!form) return;
    const formData = new FormData(form);

    const data = {
      student_id: parseInt(formData.get('student_id')),
      amount: parseInt(formData.get('amount')),
      payment_date: formData.get('payment_date'),
      payment_method: formData.get('payment_method'),
      notes: formData.get('notes') || ''
    };

    try {
      const res = await MessMateAPI.createPayment(data);
      this.closeModal();
      this.showToast(res.message, "success");
      await this.loadStudentsList();
      await this.renderCurrentPage();
      // Instantly open receipt voucher
      this.viewReceipt(res.payment_id);
    } catch (err) {
      this.showToast("Failed to record payment: " + err.message, "error");
    }
  },

  openAddDeductionModal(studentId = null, cycleId = null) {
    const students = this.state.studentsList.filter(s => s.status !== 'inactive');
    const defaultStudentId = studentId || (students[0] ? students[0].id : null);
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 class="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <span>✂️</span>
              <span>Apply Manual Meal Deduction</span>
            </h2>
            <button onclick="MessMateApp.closeModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs mb-4">
            <strong>Manual Owner Discretion:</strong> The system tallies missed meals, but <em>you</em> specify the exact deduction amount (e.g. ₹300 for 6 missed meals).
          </div>

          <form id="add-deduction-form" onsubmit="event.preventDefault(); MessMateApp.submitAddDeduction();" class="space-y-4 text-xs">
            
            <div>
              <label class="block font-bold text-stone-700 mb-1">Select Student *</label>
              <select name="student_id" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-amber-500 font-bold">
                ${students.map(s => {
                  const missed = s.billing && s.billing.missed_stats ? s.billing.missed_stats.total_missed : 0;
                  return `
                    <option value="${s.id}" ${s.id === defaultStudentId ? 'selected' : ''}>
                      ${s.name} (${missed} missed meals recorded)
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-stone-700 mb-1">Deduction Amount (₹) *</label>
                <input type="number" name="amount" min="1" required placeholder="e.g. 300" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-amber-500 font-black text-rose-700 text-base" />
              </div>

              <div>
                <label class="block font-bold text-stone-700 mb-1">Deduction Date *</label>
                <input type="date" name="deduction_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-amber-500 font-bold" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Reason for Deduction *</label>
              <input type="text" name="reason" required value="Missed meals adjustment" placeholder="e.g. Missed 6 meals during symposium" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-amber-500" />
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Missed Meal Count Reference</label>
              <input type="number" name="missed_meal_count" placeholder="6" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-amber-500" />
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button type="button" onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition">
                Apply Deduction ✓
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');
  },

  async submitAddDeduction() {
    const form = document.getElementById('add-deduction-form');
    if (!form) return;
    const formData = new FormData(form);

    const data = {
      student_id: parseInt(formData.get('student_id')),
      amount: parseInt(formData.get('amount')),
      deduction_date: formData.get('deduction_date'),
      reason: formData.get('reason'),
      missed_meal_count: parseInt(formData.get('missed_meal_count') || 0)
    };

    try {
      const res = await MessMateAPI.createDeduction(data);
      this.closeModal();
      this.showToast(res.message, "success");
      await this.loadStudentsList();
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to apply deduction: " + err.message, "error");
    }
  },

  openDiscontinueModal(studentId, studentName) {
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 class="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <span>⚠️</span>
              <span>Discontinue Student</span>
            </h2>
            <button onclick="MessMateApp.closeModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
          </div>

          <p class="text-xs text-stone-600 mb-4">
            Discontinuing <strong>${studentName}</strong> will mark their account as <strong>Inactive</strong>. They will be removed from daily attendance, but all their profile, payments, deductions, and billing histories will remain permanently preserved.
          </p>

          <form id="discontinue-student-form" onsubmit="event.preventDefault(); MessMateApp.submitDiscontinueStudent(${studentId});" class="space-y-4 text-xs">
            
            <div>
              <label class="block font-bold text-stone-700 mb-1">Discontinuation Date *</label>
              <input type="date" name="discontinue_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-rose-500 font-bold" />
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Reason for Leaving</label>
              <textarea name="discontinue_reason" rows="2" placeholder="e.g. Semester finished, moved back home, relocated" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-rose-500"></textarea>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button type="button" onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition">
                Confirm Discontinuation ✕
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');
  },

  async submitDiscontinueStudent(studentId) {
    const form = document.getElementById('discontinue-student-form');
    if (!form) return;
    const formData = new FormData(form);

    const data = {
      status: 'inactive',
      discontinue_date: formData.get('discontinue_date'),
      discontinue_reason: formData.get('discontinue_reason') || ''
    };

    try {
      await MessMateAPI.updateStudentStatus(studentId, data);
      this.closeModal();
      this.showToast("Student discontinued. Historical records preserved.", "success");
      await this.loadStudentsList();
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to discontinue: " + err.message, "error");
    }
  },

  async reactivateStudent(studentId) {
    try {
      await MessMateAPI.updateStudentStatus(studentId, { status: 'active' });
      this.showToast("Student reactivated successfully!", "success");
      await this.loadStudentsList();
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to reactivate: " + err.message, "error");
    }
  },

  async viewReceipt(paymentId) {
    try {
      const r = await MessMateAPI.getPaymentReceipt(paymentId);
      const cycle = r.cycle_summary || {};

      const html = `
        <div id="printable-receipt-modal" class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-fade-in relative">
            
            <!-- Close Button -->
            <button onclick="MessMateApp.closeModal()" class="no-print absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-xl font-bold">✕</button>

            <!-- Receipt Header -->
            <div class="text-center border-b-2 border-stone-800 pb-4">
              <div class="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto text-2xl font-bold mb-2 shadow-xs">
                🍲
              </div>
              <h2 class="text-xl font-black text-stone-900 tracking-tight brand-font">${r.mess_name || 'Annapoorna Home Mess'}</h2>
              <p class="text-xs text-stone-600 mt-0.5">Host: ${r.owner_name} • Phone: ${r.mess_phone}</p>
              <p class="text-[11px] text-stone-500">${r.mess_address}</p>
              <span class="inline-block px-3 py-1 bg-stone-100 text-stone-800 font-extrabold text-xs rounded-full uppercase tracking-wider mt-2">
                Official Payment Receipt
              </span>
            </div>

            <!-- Receipt Metadata -->
            <div class="grid grid-cols-2 gap-3 text-xs my-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <div>
                <span class="text-stone-400 font-semibold block text-[10px] uppercase">Receipt Number</span>
                <span class="font-mono font-bold text-stone-800">${r.receipt_number}</span>
              </div>
              <div>
                <span class="text-stone-400 font-semibold block text-[10px] uppercase">Payment Date</span>
                <span class="font-bold text-stone-800">${r.payment_date}</span>
              </div>
              <div>
                <span class="text-stone-400 font-semibold block text-[10px] uppercase">Student Name</span>
                <span class="font-extrabold text-stone-900">${r.student_name}</span>
              </div>
              <div>
                <span class="text-stone-400 font-semibold block text-[10px] uppercase">Billing Cycle</span>
                <span class="font-medium text-stone-700">#${r.cycle_number} (${r.cycle_start} to ${r.cycle_end})</span>
              </div>
            </div>

            <!-- Amount Breakdown Table -->
            <div class="space-y-2 border-t border-b border-stone-200 py-3 text-xs">
              <div class="flex justify-between text-stone-600">
                <span>Base Monthly Charge:</span>
                <span class="font-bold text-stone-900">₹${r.base_amount}</span>
              </div>
              <div class="flex justify-between text-stone-600">
                <span>Previous Carry-Forward Pending:</span>
                <span class="font-bold text-amber-800">₹${r.previous_pending}</span>
              </div>
              <div class="flex justify-between text-emerald-800 font-extrabold text-sm pt-2 border-t border-stone-100">
                <span>Amount Paid Now (${r.payment_method}):</span>
                <span class="text-base font-black text-emerald-700">₹${r.amount.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between text-stone-700 pt-1">
                <span>Remaining Cycle Balance:</span>
                <span class="font-black ${cycle.current_pending === 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  ₹${(cycle.current_pending !== undefined ? cycle.current_pending : 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <!-- Notes & Signoff -->
            <div class="mt-4 flex items-center justify-between text-xs text-stone-500">
              <div>
                ${r.notes ? `<p class="italic text-stone-600">Notes: ${r.notes}</p>` : ''}
                <p class="text-[10px] text-stone-400 mt-1">Thank you for dining with MessMate!</p>
              </div>
              <div class="text-right">
                <div class="w-24 border-b border-stone-400 mb-1"></div>
                <span class="text-[10px] font-bold text-stone-600 uppercase">Authorized Seal</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="no-print mt-6 pt-4 border-t border-stone-100 flex items-center justify-end space-x-2">
              <button onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition text-xs">
                Close
              </button>
              <button onclick="window.print()" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center space-x-1.5">
                <span>🖨️ Print / Save PDF</span>
              </button>
            </div>

          </div>
        </div>
      `;

      const modalContainer = document.getElementById('modal-container');
      modalContainer.innerHTML = html;
      modalContainer.classList.remove('hidden');
    } catch (err) {
      this.showToast("Failed to fetch receipt: " + err.message, "error");
    }
  },

  openStudentLeaveModal(studentId) {
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 class="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <span>✈️</span>
              <span>Submit Leave / Skip Meal Request</span>
            </h2>
            <button onclick="MessMateApp.closeModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
          </div>

          <form id="student-leave-form" onsubmit="event.preventDefault(); MessMateApp.submitStudentLeave(${studentId});" class="space-y-4 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-stone-700 mb-1">Leave Start Date *</label>
                <input type="date" name="start_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-emerald-500 font-bold" />
              </div>

              <div>
                <label class="block font-bold text-stone-700 mb-1">Leave End Date *</label>
                <input type="date" name="end_date" value="${today}" required class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-emerald-500 font-bold" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Meals Being Skipped</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center space-x-1.5 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <input type="checkbox" name="meal_b" checked class="text-emerald-600 rounded">
                  <span class="font-bold text-stone-800">🥞 Breakfast</span>
                </label>
                <label class="flex items-center space-x-1.5 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <input type="checkbox" name="meal_l" checked class="text-emerald-600 rounded">
                  <span class="font-bold text-stone-800">🍛 Lunch</span>
                </label>
                <label class="flex items-center space-x-1.5 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <input type="checkbox" name="meal_d" checked class="text-emerald-600 rounded">
                  <span class="font-bold text-stone-800">🍲 Dinner</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block font-bold text-stone-700 mb-1">Reason / Note for Mess Owner *</label>
              <textarea name="reason" required rows="2" placeholder="e.g. Going home for weekend festival / exam" class="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-emerald-500"></textarea>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button type="button" onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition">
                Submit Request ✓
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');
  },

  async submitStudentLeave(studentId) {
    const form = document.getElementById('student-leave-form');
    if (!form) return;
    const formData = new FormData(form);

    const skipped = [];
    if (formData.get('meal_b') === 'on') skipped.push('breakfast');
    if (formData.get('meal_l') === 'on') skipped.push('lunch');
    if (formData.get('meal_d') === 'on') skipped.push('dinner');

    const data = {
      student_id: studentId,
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      meals_skipped: skipped,
      reason: formData.get('reason')
    };

    try {
      await MessMateAPI.createLeaveRequest(data);
      this.closeModal();
      this.showToast("Leave request submitted successfully!", "success");
      await this.renderCurrentPage();
    } catch (err) {
      this.showToast("Failed to submit leave: " + err.message, "error");
    }
  },

  // -------------------------------------------------------------
  // TOAST & DIALOG HELPERS
  // -------------------------------------------------------------
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-emerald-800 text-white' : type === 'error' ? 'bg-rose-800 text-white' : 'bg-stone-900 text-white';
    toast.className = `${colors} px-4 py-3 rounded-xl shadow-lg text-xs font-bold flex items-center space-x-2 animate-fade-in transition duration-300`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  confirmDialog(title, message, onConfirm) {
    const html = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-fade-in text-center">
          <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-xl mb-3">
            ❓
          </div>
          <h3 class="text-base font-extrabold text-stone-900">${title}</h3>
          <p class="text-xs text-stone-500 mt-2">${message}</p>
          <div class="mt-6 flex items-center justify-center space-x-3">
            <button onclick="MessMateApp.closeModal()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition">
              Cancel
            </button>
            <button id="dialog-confirm-btn" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-xs transition">
              Confirm
            </button>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    modalContainer.classList.remove('hidden');

    document.getElementById('dialog-confirm-btn').onclick = async () => {
      MessMateApp.closeModal();
      await onConfirm();
    };
  },

  confirmResetDemo() {
    this.confirmDialog(
      "Reset Demo Database?",
      "This will restore all students, payments, attendance records, and Lingesh's scenario to the fresh demo state.",
      async () => {
        try {
          await MessMateAPI.resetDemo();
          this.showToast("Demo database reset to initial state!", "success");
          await this.init();
        } catch (err) {
          this.showToast("Reset failed: " + err.message, "error");
        }
      }
    );
  },

  exportReportsCSV() {
    const d = this.state.reportsData || {};
    const students = this.state.studentsList || [];
    let csv = "Student Name,Phone,Status,Joining Date,Monthly Fee,Current Pending\n";
    students.forEach(s => {
      const pending = s.billing ? s.billing.current_pending : 0;
      csv += `"${s.name}","${s.phone}","${s.status}","${s.joining_date}",${s.monthly_fee},${pending}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `MessMate_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    this.showToast("Report exported as CSV", "success");
  }
};

// Initialize application on DOM content load
document.addEventListener('DOMContentLoaded', () => {
  MessMateApp.init();
});
