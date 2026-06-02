import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export interface TemplateEntry {
  templateType: string
  name: string
  description: string
  icon?: string
  aspect_ratio?: string
  [key: string]: any
}

export interface TemplateConfig {
  name?: string
  description?: string
  min_duration?: number
  max_duration?: number
  supported_formats?: string[]
  output_formats?: string[]
  settings_schema?: Record<string, any>
  processing_steps?: Record<string, number>
  [key: string]: any
}

interface TemplateState {
  templates: TemplateEntry[]
  selectedTemplateType: string | null
  templateConfig: TemplateConfig | null
  templateConfigs: Record<string, TemplateConfig>
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  configStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  configError: string | null
}

const initialState: TemplateState = {
  templates: [],
  selectedTemplateType: null,
  templateConfig: null,
  templateConfigs: {},
  status: 'idle',
  configStatus: 'idle',
  error: null,
  configError: null,
}

export const fetchTemplates = createAsyncThunk(
  'template/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/templates')
      return response.data.data as Record<string, Omit<TemplateEntry, 'templateType'>>
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch templates'
      )
    }
  }
)

export const fetchTemplateConfig = createAsyncThunk(
  'template/fetchTemplateConfig',
  async (templateType: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/templates/${templateType}/config`)
      return { templateType, config: response.data.data as TemplateConfig }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch template configuration'
      )
    }
  }
)

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    setSelectedTemplateType(state, action: PayloadAction<string>) {
      state.selectedTemplateType = action.payload
      state.templateConfig = state.templateConfigs[action.payload] ?? null
      state.configError = null
      state.configStatus = state.templateConfig ? 'succeeded' : 'idle'
    },
    clearSelectedTemplateType(state) {
      state.selectedTemplateType = null
      state.templateConfig = null
      state.configError = null
      state.configStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.templates = Object.entries(action.payload).map(([templateType, template]) => ({
          templateType,
          icon: template.icon,
          aspect_ratio: template.aspect_ratio,
          name: template.name,
          description: template.description,
          ...template,
        }))
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchTemplateConfig.pending, (state) => {
        state.configStatus = 'loading'
        state.configError = null
      })
      .addCase(fetchTemplateConfig.fulfilled, (state, action) => {
        const { templateType, config } = action.payload
        state.configStatus = 'succeeded'
        state.templateConfigs[templateType] = config
        state.templateConfig = config
      })
      .addCase(fetchTemplateConfig.rejected, (state, action) => {
        state.configStatus = 'failed'
        state.configError = action.payload as string
      })
  },
})

export const { setSelectedTemplateType, clearSelectedTemplateType } = templateSlice.actions

export default templateSlice.reducer
