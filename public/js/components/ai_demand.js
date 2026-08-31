/**
 * AI Meal Demand Forecasting & Wastage Prevention Component
 * Uses time-series day-of-week attendance models to recommend food quantities and reduce mess kitchen waste.
 */

window.MessMateAiDemand = {
  render(aiData, state) {
    if (!aiData) {
      return `<div class="p-12 text-center text-stone-500">Loading AI meal forecasting...</div>`;
    }

    const { target_date, day_of_week, predicted_headcount, eligible_capacity, attendance_probabilities, leave_exclusions, highlight_message, explanations, grocery_guidance } = aiData;

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🤖</span>
              <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">AI Meal Demand Prediction</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Smart Food Planning</span>
            </div>
            <p class="text-xs text-stone-500 mt-1">Predict headcounts for upcoming meals using attendance histories and student leave requests.</p>
          </div>

          <!-- Date Selector for Forecast -->
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-stone-500">Forecast Date:</span>
            <input 
              type="date" 
              value="${target_date}"
              onchange="MessMateApp.loadAiForecast(this.value)"
              class="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-emerald-500 cursor-pointer shadow-inner"
            />
          </div>
        </div>

        <!-- AI Insight Highlight Card -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div class="absolute -right-8 -bottom-8 opacity-10 text-9xl">🥗</div>
          <div class="relative z-10 space-y-2">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">AI Kitchen Forecast</span>
              <span class="text-xs text-emerald-100 font-medium">${day_of_week}, ${target_date}</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">"${highlight_message}"</h2>
            <p class="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Prediction models day-of-week attendance behavior, active meal selections, and accounts for scheduled leaves to prevent food overpreparation.
            </p>
          </div>
        </div>

        <!-- Meal Predictions Grid -->
        <div>
          <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">🍛 Forecasted Headcounts (${day_of_week})</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Breakfast Prediction -->
            <div class="mess-card p-5 bg-white border-t-4 border-amber-500 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                  <span>🥞 Breakfast Forecast</span>
                  <span class="text-amber-700">${Math.round((attendance_probabilities.breakfast || 0.9) * 100)}% attendance rate</span>
                </div>
                <div class="flex items-baseline space-x-2 mt-2">
                  <span class="text-4xl font-black text-amber-600">${predicted_headcount.breakfast}</span>
                  <span class="text-sm text-stone-500 font-semibold">students expected</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
                <span>Eligible in plan: <strong>${eligible_capacity.breakfast}</strong></span>
                <span>Leaves: <strong>${leave_exclusions.breakfast}</strong></span>
              </div>
            </div>

            <!-- Lunch Prediction -->
            <div class="mess-card p-5 bg-white border-t-4 border-orange-500 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                  <span>🍛 Lunch Forecast</span>
                  <span class="text-orange-700">${Math.round((attendance_probabilities.lunch || 0.95) * 100)}% attendance rate</span>
                </div>
                <div class="flex items-baseline space-x-2 mt-2">
                  <span class="text-4xl font-black text-orange-600">${predicted_headcount.lunch}</span>
                  <span class="text-sm text-stone-500 font-semibold">students expected</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
                <span>Eligible in plan: <strong>${eligible_capacity.lunch}</strong></span>
                <span>Leaves: <strong>${leave_exclusions.lunch}</strong></span>
              </div>
            </div>

            <!-- Dinner Prediction -->
            <div class="mess-card p-5 bg-white border-t-4 border-indigo-500 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                  <span>🍲 Dinner Forecast</span>
                  <span class="text-indigo-700">${Math.round((attendance_probabilities.dinner || 0.88) * 100)}% attendance rate</span>
                </div>
                <div class="flex items-baseline space-x-2 mt-2">
                  <span class="text-4xl font-black text-indigo-600">${predicted_headcount.dinner}</span>
                  <span class="text-sm text-stone-500 font-semibold">students expected</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
                <span>Eligible in plan: <strong>${eligible_capacity.dinner}</strong></span>
                <span>Leaves: <strong>${leave_exclusions.dinner}</strong></span>
              </div>
            </div>

          </div>
        </div>

        <!-- Grocery Preparation & Waste Reduction Guidance -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <!-- Grocery Guidance Card -->
          <div class="mess-card p-5 bg-white space-y-4">
            <div class="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 class="text-sm font-bold text-stone-800 flex items-center space-x-2">
                <span>🛒 Recommended Grocery Prep</span>
              </h3>
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md">
                ~${grocery_guidance.estimated_waste_reduction_pct}% Waste Reduction
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <p class="text-[10px] uppercase font-bold text-stone-400">Raw Rice</p>
                <p class="text-lg font-black text-stone-900 mt-1">${grocery_guidance.rice_kg} kg</p>
                <p class="text-[10px] text-stone-500">for Lunch/Dinner</p>
              </div>
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <p class="text-[10px] uppercase font-bold text-stone-400">Batter / Tiffin</p>
                <p class="text-lg font-black text-stone-900 mt-1">${grocery_guidance.batter_kg} kg</p>
                <p class="text-[10px] text-stone-500">for Breakfast</p>
              </div>
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <p class="text-[10px] uppercase font-bold text-stone-400">Vegetables</p>
                <p class="text-lg font-black text-stone-900 mt-1">${grocery_guidance.veggies_kg} kg</p>
                <p class="text-[10px] text-stone-500">curry & sides</p>
              </div>
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <p class="text-[10px] uppercase font-bold text-stone-400">Dal / Lentils</p>
                <p class="text-lg font-black text-stone-900 mt-1">${grocery_guidance.dal_kg} kg</p>
                <p class="text-[10px] text-stone-500">sambar & rasam</p>
              </div>
            </div>

            <p class="text-xs text-stone-500">
              *Calculated based on standard South Indian student portion sizing (100-120g raw rice per student per meal).
            </p>
          </div>

          <!-- Model Explainability Card -->
          <div class="mess-card p-5 bg-white space-y-3">
            <h3 class="text-sm font-bold text-stone-800 flex items-center space-x-2 border-b border-stone-100 pb-3">
              <span>🧠 Model Explainability</span>
            </h3>
            
            <div class="space-y-2.5">
              ${explanations.map(exp => `
                <div class="flex items-start space-x-2.5 text-xs text-stone-700">
                  <span class="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>${exp}</span>
                </div>
              `).join('')}
            </div>

            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 mt-4">
              <strong>Modular & Fault-Tolerant:</strong> If AI forecasting experiences any anomaly or network interruption, MessMate falls back gracefully to active student plan headcounts without interrupting attendance or billing.
            </div>
          </div>

        </div>

      </div>
    `;
  }
};
