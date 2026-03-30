<script setup lang="ts">
const { profile } = useProfile()
const { setBreadcrumbs } = useBreadcrumbs()

setBreadcrumbs([
  { label: 'My Account' }
])

useHead({
  title: 'My Account - pdf2course'
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-12">
    <div class="flex items-center gap-6 mb-12">
      <div class="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-400 border-2 border-slate-700">
        {{ profile?.full_name?.charAt(0) || 'U' }}
      </div>
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">{{ profile?.full_name || 'User' }}</h1>
        <p class="text-slate-400 font-mono text-sm">{{ profile?.role === 'admin' ? 'Administrator' : 'Learning Enthusiast' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile Information
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <p class="text-slate-200">{{ profile?.full_name || 'Not set' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Role</label>
            <p class="text-slate-200 capitalize">{{ profile?.role || 'user' }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Account Security
        </h2>
        <p class="text-slate-400 text-sm mb-6">Manage your password and security settings to keep your account safe.</p>
        <UiButton variant="secondary" :block="false">Update Security Settings</UiButton>
      </div>
    </div>

    <!-- Placeholder for more sections -->
    <div class="mt-12 opacity-50 pointer-events-none">
      <div class="h-32 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-sm italic">
        Settings related to streaks, XP, and preferences will appear here
      </div>
    </div>
  </div>
</template>
