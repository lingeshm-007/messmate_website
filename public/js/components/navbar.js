/**
 * Navigation Bar Component
 * Top bar with branding, role switcher (Admin / Student), active date, and demo scenario helper.
 */

window.MessMateNavbar = {
  render(state) {
    const isStudent = state.userRole === 'student';
    const studentsList = state.studentsList || [];
    const activeStudentId = state.selectedStudentId || (studentsList.length > 0 ? studentsList[0].id : null);
    const messInfo = state.messSettings || { mess_name: 'Annapoorna Home Mess', owner_name: 'Lakshmi Amma' };

    return `
      <header class="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            
            <!-- Brand Logo & Tagline -->
            <div class="flex items-center space-x-3 cursor-pointer" onclick="MessMateApp.navigateTo('dashboard')">
              <div class="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm font-bold text-xl">
                🍲
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-extrabold text-xl text-stone-900 tracking-tight brand-font">MessMate</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold hidden sm:inline-block">Home Mess</span>
                </div>
                <p class="text-xs text-stone-500 hidden md:block">Simple Food & Mess Management</p>
              </div>
            </div>

            <!-- Role Switcher & Controls -->
            <div class="flex items-center space-x-2 sm:space-x-3">
              
              <!-- Role Switcher Toggle -->
              <div class="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs font-semibold">
                <button 
                  onclick="MessMateApp.setRole('admin')" 
                  class="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${!isStudent ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}">
                  <span>👩‍🍳</span>
                  <span class="hidden sm:inline">Admin (Aunty)</span>
                  <span class="sm:hidden">Admin</span>
                </button>
                <button 
                  onclick="MessMateApp.setRole('student')" 
                  class="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${isStudent ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}">
                  <span>🎓</span>
                  <span class="hidden sm:inline">Student View</span>
                  <span class="sm:hidden">Student</span>
                </button>
              </div>

              <!-- Student Selector Dropdown (When in Student View) -->
              ${isStudent ? `
                <div class="relative">
                  <select 
                    onchange="MessMateApp.switchStudent(this.value)"
                    class="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer">
                    ${studentsList.map(s => `
                      <option value="${s.id}" ${s.id == activeStudentId ? 'selected' : ''}>
                        👤 ${s.name} (${s.status})
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}

              <!-- Reset Demo Data Button -->
              <button 
                onclick="MessMateApp.confirmResetDemo()"
                title="Reset Database to Fresh Demo State" 
                class="p-2 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition text-xs border border-transparent hover:border-orange-200 flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span class="hidden lg:inline text-xs font-medium">Reset Demo</span>
              </button>

            </div>

          </div>

          <!-- Secondary Navigation Tabs for Admin -->
          ${!isStudent ? `
            <nav class="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-stone-100 text-xs sm:text-sm font-medium scrollbar-none">
              <button onclick="MessMateApp.navigateTo('dashboard')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'dashboard' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                📊 Dashboard
              </button>
              <button onclick="MessMateApp.navigateTo('attendance')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'attendance' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                ✅ Attendance
              </button>
              <button onclick="MessMateApp.navigateTo('students')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'students' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                👥 Students
              </button>
              <button onclick="MessMateApp.navigateTo('billing')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'billing' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                💳 Billing & Deductions
              </button>
              <button onclick="MessMateApp.navigateTo('payments')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'payments' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                💰 Payments
              </button>
              <button onclick="MessMateApp.navigateTo('menu')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'menu' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                🍲 Weekly Menu
              </button>
              <button onclick="MessMateApp.navigateTo('ai_demand')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'ai_demand' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                🤖 AI Demand Insight
              </button>
              <button onclick="MessMateApp.navigateTo('reports')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'reports' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                📈 Reports
              </button>
              <button onclick="MessMateApp.navigateTo('settings')" class="nav-tab px-3 py-1.5 rounded-lg whitespace-nowrap ${state.currentPage === 'settings' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-stone-600 hover:bg-stone-100'}">
                ⚙️ Settings
              </button>
            </nav>
          ` : ''}

        </div>
      </header>
    `;
  }
};
