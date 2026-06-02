import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useAuth'
import {
  createProject as createProjectThunk,
  fetchProjectById as fetchProjectByIdThunk,
  fetchProjects as fetchProjectsThunk,
  processProject as processProjectThunk,
  uploadProjectVideo as uploadProjectVideoThunk,
  updateProject as updateProjectThunk,
  Project,
} from '@/store/projectSlice'

export function useProject() {
  const dispatch = useAppDispatch()
  const projectState = useAppSelector((state) => state.project)

  const createProject = useCallback(
    async (payload: {
      title: string
      template_type: string
      settings: Record<string, any>
    }) => {
      return await dispatch(createProjectThunk(payload)).unwrap()
    },
    [dispatch]
  )

  const uploadProjectVideo = useCallback(
    async (payload: { projectId: number | string; video: File }) => {
      return await dispatch(uploadProjectVideoThunk(payload)).unwrap()
    },
    [dispatch]
  )

  const processProject = useCallback(
    async (projectId: number | string) => {
      return await dispatch(processProjectThunk(projectId)).unwrap()
    },
    [dispatch]
  )

  const fetchProjects = useCallback(async () => {
    return await dispatch(fetchProjectsThunk()).unwrap()
  }, [dispatch])

  const fetchProjectById = useCallback(
    async (projectId: number | string) => {
      return await dispatch(fetchProjectByIdThunk(projectId)).unwrap()
    },
    [dispatch]
  )

  const updateProject = useCallback(
    async (payload: { projectId: number | string; data: Partial<Project> }) => {
      return await dispatch(updateProjectThunk(payload)).unwrap()
    },
    [dispatch]
  )

  return {
    ...projectState,
    createProject,
    uploadProjectVideo,
    processProject,
    updateProject,
    fetchProjects,
    fetchProjectById,
  }
}
