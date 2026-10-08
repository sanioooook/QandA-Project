<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import PrefsControls from '@/components/PrefsControls.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { user } = storeToRefs(auth);

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const toggle = ref<HTMLButtonElement | null>(null);

function close(focusButton = false) {
  open.value = false;
  if (focusButton) toggle.value?.focus();
}

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close(true);
}

watch(open, (value) => {
  if (value) {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);
  } else {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown);
  }
});
watch(() => route.fullPath, () => close());
onBeforeUnmount(() => close());

async function logout() {
  close();
  await auth.logout();
  await router.push({ name: 'active' });
}
</script>

<template>
  <div v-if="user" ref="root" class="user-menu">
    <button
      ref="toggle"
      type="button"
      class="toggle"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="t('menu.open')"
      :title="t('nav.signedInAs', { name: user.displayName, email: user.email })"
      @click="open = !open"
    >
      <UserAvatar :name="user.displayName" :url="user.avatarUrl" :size="32" />
    </button>

    <Transition name="pop">
      <div v-if="open" class="menu card" role="menu">
        <div class="who">
          <UserAvatar :name="user.displayName" :url="user.avatarUrl" :size="44" />
          <div class="who-text">
            <strong>{{ user.displayName }}</strong>
            <span class="muted">{{ user.email }}</span>
          </div>
        </div>

        <RouterLink :to="{ name: 'account' }" class="item" role="menuitem">
          <AppIcon name="settings" :size="17" />{{ t('menu.settings') }}
        </RouterLink>
        <RouterLink :to="{ name: 'change-password' }" class="item" role="menuitem">
          <AppIcon name="key" :size="17" />{{ t('menu.changePassword') }}
        </RouterLink>

        <div class="prefs-row">
          <PrefsControls />
        </div>

        <button type="button" class="item danger" role="menuitem" @click="logout">
          <AppIcon name="logout" :size="17" />{{ t('nav.logout') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.toggle {
  display: grid;
  padding: 2px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}

.toggle:hover,
.toggle[aria-expanded='true'] {
  border-color: var(--primary);
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  display: grid;
  gap: 2px;
  width: min(300px, calc(100vw - 32px));
  padding: 8px;
  box-shadow: var(--shadow-lg);
}

.who {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.who-text {
  display: grid;
  min-width: 0;
}

.who-text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.who-text .muted {
  font-size: 0.85rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item:hover {
  background: var(--surface-2);
  text-decoration: none;
}

.item.danger {
  color: var(--danger);
}

.prefs-row {
  padding: 8px 10px;
  margin: 4px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
