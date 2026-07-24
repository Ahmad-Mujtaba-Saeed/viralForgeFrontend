import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export interface ProjectOutputVideo {
  url: string | null
  thumbnail?: string | null
  duration?: number | null
  score?: number | null
  subtitle?: string | null
}

export interface Project {
  id: number
  title: string
  template_type: string
  settings: Record<string, any>
  status: string
  progress: number
  error_message?: string | null
  failed_step?: string | null
  video_path?: string | null
  output_path?: string | null
  output_videos?: ProjectOutputVideo[]
  thumbnail_path?: string | null
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  duration?: number | null
  aspect_ratio?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** Args shared by the paginated list thunks. `append` concatenates the page
 *  onto the existing list (Load more) instead of replacing it. */
export interface PageQuery {
  page?: number
  perPage?: number
  search?: string
  append?: boolean
}

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  projectsMeta: PageMeta | null
  videos: Project[]
  videosMeta: PageMeta | null
  isCreating: boolean
  isUploading: boolean
  isProcessing: boolean
  isUpdating: boolean
  isFetching: boolean
  isFetchingProjects: boolean
  isFetchingVideos: boolean
  error: string | null
  fetchProjectsError: string | null
  fetchVideosError: string | null
}

const initialState: ProjectState = {
  currentProject: null,
  projects: [],
  projectsMeta: null,
  videos: [],
  videosMeta: null,
  isCreating: false,
  isUploading: false,
  isProcessing: false,
  isUpdating: false,
  isFetching: false,
  isFetchingProjects: false,
  isFetchingVideos: false,
  error: null,
  fetchProjectsError: null,
  fetchVideosError: null,
}

const toPageMeta = (meta: any): PageMeta | null =>
  meta && typeof meta === 'object'
    ? {
        current_page: Number(meta.current_page) || 1,
        last_page: Number(meta.last_page) || 1,
        per_page: Number(meta.per_page) || 0,
        total: Number(meta.total) || 0,
      }
    : null

export const createProject = createAsyncThunk(
  'project/create',
  async (
    projectData: {
      title: string
      template_type: string
      settings: Record<string, any>
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api/projects', projectData)
      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create project'
      )
    }
  }
)

export const uploadProjectVideo = createAsyncThunk(
  'project/uploadVideo',
  async (
    payload: { projectId: number | string; video: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData()
      formData.append('video', payload.video)

      const response = await api.post(
        `/api/projects/${payload.projectId}/upload-video`,
        formData
      )

      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to upload video'
      )
    }
  }
)

export const uploadProjectSettingFile = createAsyncThunk(
  'project/uploadSettingFile',
  async (
    payload: { projectId: number | string; fieldKey: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData()
      formData.append('file', payload.file)
      formData.append('field_key', payload.fieldKey)

      const response = await api.post(
        `/api/projects/${payload.projectId}/upload-setting-file`,
        formData
      )

      return response.data.data as { path: string; file_name: string }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to upload setting file'
      )
    }
  }
)

export const processProject = createAsyncThunk(
  'project/process',
  async (projectId: number | string, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('video_id', String(projectId))

      const response = await api.post(
        `/api/projects/${projectId}/process`,
        formData
      )

      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to start processing'
      )
    }
  }
)

export const updateProject = createAsyncThunk(
  'project/update',
  async (
    payload: { projectId: number | string; data: Partial<Project> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/api/projects/${payload.projectId}`, payload.data)
      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update project'
      )
    }
  }
)

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (arg: PageQuery = {}, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 15, search } = arg
      const response = await api.get('/api/projects', {
        params: { page, per_page: perPage, ...(search ? { search } : {}) },
      })
      const payload = response.data?.data
      const projects = Array.isArray(payload?.data) ? payload.data : []
      return {
        projects: projects as Project[],
        meta: toPageMeta(payload?.meta),
        append: !!arg.append,
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch projects'
      )
    }
  }
)

export const fetchVideos = createAsyncThunk(
  'project/fetchVideos',
  async (arg: PageQuery = {}, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 12, search } = arg
      const response = await api.get('/api/projects/videos', {
        params: { page, per_page: perPage, ...(search ? { search } : {}) },
      })
      const payload = response.data?.data
      const videos = Array.isArray(payload?.data) ? payload.data : []
      return {
        videos: videos as Project[],
        meta: toPageMeta(payload?.meta),
        append: !!arg.append,
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch videos'
      )
    }
  }
)

export const fetchProjectById = createAsyncThunk(
  'project/fetchById',
  async (projectId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/projects/${projectId}`)
      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch project'
      )
    }
  }
)

export const retryProject = createAsyncThunk(
  'project/retry',
  async (projectId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/retry`)
      return response.data.data as Project
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to retry project'
      )
    }
  }
)

export const deleteProject = createAsyncThunk(
  'project/delete',
  async (projectId: number | string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/projects/${projectId}`)
      return projectId
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete project'
      )
    }
  }
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearProject: (state) => {
      state.currentProject = null
      state.error = null
      state.isCreating = false
      state.isUploading = false
      state.isProcessing = false
      state.isFetching = false
    },
    // Merge partial updates into currentProject (used for realtime updates)
    updateCurrentProject: (state, action: PayloadAction<Partial<Project>>) => {
      if (!state.currentProject) return
      state.currentProject = { ...state.currentProject, ...action.payload }
    },
    // Merge partial updates into a matching entry of the projects list (used for realtime list-page progress)
    updateProjectInList: (state, action: PayloadAction<{ id: number | string } & Partial<Omit<Project, 'id'>>>) => {
      const { id, ...changes } = action.payload
      const index = state.projects.findIndex((p) => String(p.id) === String(id))
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...changes }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isCreating = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload as string
      })

    builder
      .addCase(uploadProjectVideo.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadProjectVideo.fulfilled, (state, action) => {
        state.isUploading = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(uploadProjectVideo.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.payload as string
      })

    builder
      .addCase(uploadProjectSettingFile.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadProjectSettingFile.fulfilled, (state) => {
        state.isUploading = false
        state.error = null
      })
      .addCase(uploadProjectSettingFile.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.payload as string
      })

    builder
      .addCase(processProject.pending, (state) => {
        state.isProcessing = true
        state.error = null
      })
      .addCase(processProject.fulfilled, (state, action) => {
        state.isProcessing = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(processProject.rejected, (state, action) => {
        state.isProcessing = false
        state.error = action.payload as string
      })

    builder
      .addCase(updateProject.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isUpdating = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })

    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isFetching = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isFetchingProjects = true
        state.fetchProjectsError = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isFetchingProjects = false
        const { projects, meta, append } = action.payload
        state.projects = append ? [...state.projects, ...projects] : projects
        state.projectsMeta = meta
        state.fetchProjectsError = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isFetchingProjects = false
        state.fetchProjectsError = action.payload as string
      })

    builder
      .addCase(fetchVideos.pending, (state) => {
        state.isFetchingVideos = true
        state.fetchVideosError = null
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isFetchingVideos = false
        const { videos, meta, append } = action.payload
        state.videos = append ? [...state.videos, ...videos] : videos
        state.videosMeta = meta
        state.fetchVideosError = null
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isFetchingVideos = false
        state.fetchVideosError = action.payload as string
      })

    builder
      .addCase(retryProject.pending, (state) => {
        state.isProcessing = true
        state.error = null
      })
      .addCase(retryProject.fulfilled, (state, action) => {
        state.isProcessing = false
        state.currentProject = action.payload
        state.error = null
      })
      .addCase(retryProject.rejected, (state, action) => {
        state.isProcessing = false
        state.error = action.payload as string
      })

    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => String(p.id) !== String(action.payload))
        state.videos = state.videos.filter((p) => String(p.id) !== String(action.payload))
        if (state.currentProject && String(state.currentProject.id) === String(action.payload)) {
          state.currentProject = null
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { clearProject, updateCurrentProject, updateProjectInList } = projectSlice.actions
export default projectSlice.reducer
