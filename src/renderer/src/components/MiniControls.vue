<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/16/solid'
import { ProjectBadge, time, TimeTrackerStartStop } from '@solidtime/ui'
import { useLiveTimer } from '../utils/liveTimer'
import { useMyMemberships } from '../utils/myMemberships'
import { computed, watch, watchEffect } from 'vue'
import { useStorage } from '@vueuse/core'
import { emptyTimeEntry } from '../utils/timeEntries'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { getAllProjects } from '../utils/projects'
import { getAllTasks } from '../utils/tasks'
import { sendEventToWindow } from '../utils/events'
import { showMainWindow } from '../utils/window'
import { dayjs } from '../utils/dayjs'
const { liveTimer, startLiveTimer, stopLiveTimer } = useLiveTimer()

const { currentOrganizationId } = useMyMemberships()

const isRunning = computed(
    () => currentTimeEntry.value.start !== '' && currentTimeEntry.value.start !== null
)

const organizationIdToLoad = computed(() => {
    if (currentTimeEntry.value.organization_id && currentTimeEntry.value.organization_id !== '') {
        return currentTimeEntry.value.organization_id
    }
    return currentOrganizationId.value
})

const currentOrganizationLoaded = computed(() => !!organizationIdToLoad.value)

const currentTimeEntry = useStorage('currentTimeEntry', { ...emptyTimeEntry })
const { data: projectsResponse } = useQuery({
    queryKey: ['projects', organizationIdToLoad],
    queryFn: () => getAllProjects(organizationIdToLoad.value),
    enabled: currentOrganizationLoaded,
})

const { data: tasksResponse } = useQuery({
    queryKey: ['tasks', organizationIdToLoad],
    queryFn: () => getAllTasks(organizationIdToLoad.value),
    enabled: currentOrganizationLoaded,
})

const { data: currentTimeEntryTasksResponse } = useQuery({
    queryKey: ['tasks', currentTimeEntry.value.organization_id],
    queryFn: () => getAllTasks(currentTimeEntry.value.organization_id),
    enabled: currentOrganizationLoaded,
})

const lastTimeEntry = useStorage('lastTimeEntry', { ...emptyTimeEntry })

const tasks = computed(() => {
    if (isRunning.value) {
        return currentTimeEntryTasksResponse.value?.data
    }
    return tasksResponse.value?.data
})
const projects = computed(() => {
    return projectsResponse.value?.data
})

const shownDescription = computed(() => {
    if (isRunning.value) {
        return currentTimeEntry.value.description !== ''
            ? currentTimeEntry.value.description
            : currentTask.value?.name
    } else if (!isRunning.value) {
        return lastTimeEntry.value.description !== ''
            ? lastTimeEntry.value.description
            : currentTask.value?.name
    }
    return null
})
const currentTask = computed(() => {
    if (isRunning.value) {
        return tasks.value?.find((task) => task.id === currentTimeEntry.value.task_id)
    } else {
        return tasks.value?.find((task) => task.id === lastTimeEntry.value.task_id)
    }
})
const shownProject = computed(() => {
    if (isRunning.value) {
        return projects.value?.find((project) => project.id === currentTimeEntry.value.project_id)
    } else {
        return projects.value?.find((project) => project.id === lastTimeEntry.value.project_id)
    }
})

const queryClient = useQueryClient()

// invalidate queries if we encounter projects or tasks that are not in the store
// because stores are currently not synced between mini and main window
// (future, currentlyexperimental: https://tanstack.com/query/latest/docs/framework/vue/plugins/createPersister)
watch(currentTimeEntry, () => {
    console.log('currentTimeEntry changed')
    if (
        currentTimeEntry.value.project_id &&
        projects.value &&
        !projects.value.some((project) => project.id === currentTimeEntry.value.project_id)
    ) {
        console.log('project invalidate')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
    if (
        currentTimeEntry.value.task_id &&
        tasks.value &&
        !tasks.value.some((task) => task.id === currentTimeEntry.value.task_id)
    ) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
})
watch(lastTimeEntry, () => {
    if (
        lastTimeEntry.value.project_id &&
        projects.value &&
        !projects.value.some((project) => project.id === lastTimeEntry.value.project_id)
    ) {
        queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
    if (
        lastTimeEntry.value.task_id &&
        tasks.value &&
        !tasks.value.some((task) => task.id === lastTimeEntry.value.task_id)
    ) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
})

watchEffect(() => {
    if (isRunning.value) {
        startLiveTimer()
    } else {
        stopLiveTimer()
    }
})

function focusMainWindow() {
    showMainWindow()
}

function onToggleButtonPress(newState: boolean) {
    if (newState) {
        sendEventToWindow('main', 'startTimer')
    } else {
        showMainWindow()
        sendEventToWindow('main', 'stopTimer')
    }
}

const currentTimer = computed(() => {
    if (liveTimer.value && currentTimeEntry.value.start) {
        const startTime = dayjs(currentTimeEntry.value.start)
        const diff = liveTimer.value.diff(startTime, 'seconds')
        return time.formatDuration(diff)
    }
    return '00:00:00'
})
</script>

<template>
    <div
        class="h-screen relative w-screen border-border-secondary border bg-primary rounded-[10px] text-white py-1 flex items-center cursor-default justify-between select-none">
        <div class="text-sm text-muted flex items-center relative flex-1 min-w-0">
            <div class="pl-1 pr-1 z-20 relative block" style="-webkit-app-region: drag">
                <svg
                    class="h-5"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    data-tauri-drag-region>
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z"
                        fill="currentColor"
                        data-tauri-drag-region />
                </svg>
            </div>
            <div
                class="cursor-pointer rounded-lg flex items-center shrink min-w-0"
                @click="focusMainWindow">
                <div class="flex items-center flex-1 space-x-0.5 min-w-0">
                    <ProjectBadge
                        class="px-0 whitespace-nowrap overflow-ellipsis"
                        :border="false"
                        :color="shownProject?.color"
                        :name="shownProject?.name ?? 'No Project'"></ProjectBadge>
                    <div class="flex text-xs flex-1 truncate items-center space-x-0.5 shrink">
                        <ChevronRightIcon class="w-4 shrink-0 text-muted"></ChevronRightIcon>
                        <span
                            class="truncate shrink text-muted opacity-50 hover:opacity-100 transition-opacity min-w-0"
                            >{{ shownDescription ?? 'No Description' }}</span
                        >
                    </div>
                </div>
            </div>
            <div class="flex-1 h-6 w-full" style="-webkit-app-region: drag"></div>
        </div>

        <div class="pr-1 flex items-center space-x-1">
            <div
                class="text-xs font-semibold text-muted px-2 w-[65px] text-left"
                style="-webkit-app-region: drag">
                {{ currentTimer }}
            </div>
            <TimeTrackerStartStop
                :active="isRunning"
                size="small"
                @changed="onToggleButtonPress"></TimeTrackerStartStop>
        </div>
    </div>
</template>

<style scoped></style>
