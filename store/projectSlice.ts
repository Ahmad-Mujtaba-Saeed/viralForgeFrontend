import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/lib/axios'

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
  thumbnail_path?: string | null
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  duration?: number | null
  created_at?: string | null
  updated_at?: string | null
}

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  isCreating: boolean
  isUploading: boolean
  isProcessing: boolean
  isUpdating: boolean
  isFetching: boolean
  isFetchingProjects: boolean
  error: string | null
  fetchProjectsError: string | null
}

const initialState: ProjectState = {
  currentProject: null,
  projects: [],
  isCreating: false,
  isUploading: false,
  isProcessing: false,
  isUpdating: false,
  isFetching: false,
  isFetchingProjects: false,
  error: null,
  fetchProjectsError: null,
}

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/projects')
      const payload = response.data?.data
      const projects = Array.isArray(payload?.data) ? payload.data : []
      return projects as Project[]
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch projects'
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
        state.projects = action.payload
        state.fetchProjectsError = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isFetchingProjects = false
        state.fetchProjectsError = action.payload as string
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
  },
})

export const { clearProject, updateCurrentProject } = projectSlice.actions
export default projectSlice.reducer
