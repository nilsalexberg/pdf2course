<script setup lang="ts">
  const { breadcrumbs } = useBreadcrumbs();
  const { profile } = useProfile();
  const route = useRoute();

  const isAdmin = computed(() => profile.value?.role === 'admin');
</script>

<template>
  <nav class="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Left: Logo & Breadcrumbs -->
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 transition-transform group-hover:scale-110"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span class="text-lg font-bold tracking-tight text-white hidden sm:block"
            >pdf2course</span
          >
        </NuxtLink>

        <div
          v-if="breadcrumbs.length > 0"
          class="hidden md:flex items-center gap-2 text-sm text-slate-500"
        >
          <div class="h-4 w-px bg-slate-800 mx-1"></div>
          <template v-for="(item, index) in breadcrumbs" :key="index">
            <span v-if="index > 0" class="text-slate-600">/</span>
            <NuxtLink
              v-if="item.to && index < breadcrumbs.length - 1"
              :to="item.to"
              class="hover:text-emerald-400 transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
            <span v-else class="text-slate-200 font-medium truncate max-w-[200px]">
              {{ item.label }}
            </span>
          </template>
        </div>
      </div>

      <!-- Right: Navigation Links -->
      <div class="flex items-center gap-2">
        <UiButton
          to="/dashboard"
          variant="ghost"
          :class="[route.path.startsWith('/dashboard') ? 'text-emerald-400' : '']"
          :block="false"
        >
          Dashboard
        </UiButton>

        <UiButton
          v-if="isAdmin"
          to="/admin"
          variant="ghost"
          :class="[route.path.startsWith('/admin') ? 'text-emerald-400' : '']"
          :block="false"
        >
          Admin
        </UiButton>

        <div class="h-6 w-px bg-slate-800 mx-2"></div>

        <UiButton
          to="/account"
          variant="ghost"
          :class="[route.path === '/account' ? 'text-emerald-400' : '']"
          :block="false"
          class="flex items-center gap-2"
        >
          <img
            v-if="profile?.avatar_url"
            :src="profile.avatar_url"
            alt="avatar"
            class="h-6 w-6 rounded-full object-cover border border-slate-700"
          />
          <div
            v-else
            class="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700"
          >
            {{ profile?.full_name?.charAt(0) || 'U' }}
          </div>
          <span class="hidden sm:inline">My Account</span>
        </UiButton>
      </div>
    </div>
  </nav>
</template>
