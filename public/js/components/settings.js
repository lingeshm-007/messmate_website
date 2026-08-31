/**
 * Admin Settings Component
 * Configures mess info, capacity limits, meal plan pricing, and meal toggles.
 */

window.MessMateSettings = {
  render(settings, state) {
    const s = settings || {};

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Mess Settings & Pricing</h1>
            <p class="text-xs text-stone-500 mt-1">Configure capacity, default meal pricing, mess details, and operational rules.</p>
          </div>

          <button 
            onclick="MessMateApp.saveSettings()"
            class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center space-x-2">
            <span>💾 Save Settings</span>
          </button>
        </div>

        <form id="settings-form" onsubmit="event.preventDefault(); MessMateApp.saveSettings();" class="space-y-6">
          
          <!-- 1. Mess Profile Information -->
          <div class="mess-card p-5 bg-white space-y-4">
            <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-2.5">
              🏡 Mess & Host Information
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Mess Name</label>
                <input 
                  type="text" 
                  name="mess_name" 
                  value="${s.mess_name || 'Annapoorna Home Mess'}" 
                  required
                  class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Owner / Host Name</label>
                <input 
                  type="text" 
                  name="owner_name" 
                  value="${s.owner_name || 'Lakshmi Amma'}" 
                  required
                  class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Contact Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value="${s.phone || '9845012345'}" 
                  required
                  class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Address / Location</label>
                <input 
                  type="text" 
                  name="address" 
                  value="${s.address || 'No. 14, College Road, Near PSG Tech, Coimbatore'}" 
                  required
                  class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <!-- 2. Capacity & Scale -->
          <div class="mess-card p-5 bg-white space-y-4">
            <div class="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">
                👥 Student Capacity
              </h2>
              <span class="text-xs text-orange-700 font-semibold">Configurable at any time</span>
            </div>

            <div class="max-w-xs">
              <label class="block text-xs font-bold text-stone-700 mb-1">Maximum Active Students</label>
              <div class="flex items-center space-x-3">
                <input 
                  type="number" 
                  name="capacity" 
                  min="1" 
                  max="200" 
                  value="${s.capacity || 20}" 
                  required
                  class="w-32 text-sm font-bold p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500"
                />
                <span class="text-xs text-stone-500">students maximum</span>
              </div>
              <p class="text-[11px] text-stone-400 mt-1">If you change this to 25, the dashboard instantly reflects e.g. 17 / 25.</p>
            </div>
          </div>

          <!-- 3. Monthly Plan Pricing Rules -->
          <div class="mess-card p-5 bg-white space-y-4">
            <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-2.5">
              💵 Default Meal Plan Pricing
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div class="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl">
                <label class="block text-xs font-extrabold text-orange-900 mb-1">Three-Meal Monthly Fee (₹)</label>
                <p class="text-[10px] text-stone-500 mb-2">Breakfast + Lunch + Dinner</p>
                <input 
                  type="number" 
                  name="price_three_meals" 
                  value="${s.price_three_meals || 4000}" 
                  required
                  class="w-full text-sm font-bold p-2.5 bg-white border border-stone-300 rounded-lg focus:ring-orange-500"
                />
              </div>

              <div class="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                <label class="block text-xs font-extrabold text-amber-900 mb-1">Two-Meal Monthly Fee (₹)</label>
                <p class="text-[10px] text-stone-500 mb-2">Any 2 meals selected</p>
                <input 
                  type="number" 
                  name="price_two_meals" 
                  value="${s.price_two_meals || 3000}" 
                  required
                  class="w-full text-sm font-bold p-2.5 bg-white border border-stone-300 rounded-lg focus:ring-orange-500"
                />
              </div>

              <div class="p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <label class="block text-xs font-extrabold text-stone-900 mb-1">One-Meal Monthly Fee (₹)</label>
                <p class="text-[10px] text-stone-500 mb-2">Single meal option</p>
                <input 
                  type="number" 
                  name="price_one_meal" 
                  value="${s.price_one_meal || 1800}" 
                  required
                  class="w-full text-sm font-bold p-2.5 bg-white border border-stone-300 rounded-lg focus:ring-orange-500"
                />
              </div>

            </div>
          </div>

          <!-- 4. Meal Service Toggles -->
          <div class="mess-card p-5 bg-white space-y-4">
            <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-2.5">
              🍽️ Active Meal Services
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                <input type="checkbox" name="enable_breakfast" ${s.enable_breakfast ? 'checked' : ''} class="w-4 h-4 text-orange-600 rounded">
                <span class="text-xs font-bold text-stone-800">🥞 Breakfast Service</span>
              </label>

              <label class="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                <input type="checkbox" name="enable_lunch" ${s.enable_lunch ? 'checked' : ''} class="w-4 h-4 text-orange-600 rounded">
                <span class="text-xs font-bold text-stone-800">🍛 Lunch Service</span>
              </label>

              <label class="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                <input type="checkbox" name="enable_dinner" ${s.enable_dinner ? 'checked' : ''} class="w-4 h-4 text-orange-600 rounded">
                <span class="text-xs font-bold text-stone-800">🍲 Dinner Service</span>
              </label>
            </div>
          </div>

        </form>

      </div>
    `;
  }
};
