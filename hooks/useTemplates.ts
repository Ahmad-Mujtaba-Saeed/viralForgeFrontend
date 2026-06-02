'use client'

import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useAuth'
import {
  fetchTemplates,
  fetchTemplateConfig,
  setSelectedTemplateType,
  clearSelectedTemplateType,
} from '@/store/templateSlice'

export function useTemplates() {
  const dispatch = useAppDispatch()
  const templateState = useAppSelector((state) => state.template)

  const loadTemplates = useCallback(async () => {
    return await dispatch(fetchTemplates()).unwrap()
  }, [dispatch])

  const loadTemplateConfig = useCallback(
    async (templateType: string) => {
      return await dispatch(fetchTemplateConfig(templateType)).unwrap()
    },
    [dispatch]
  )

  const selectTemplate = useCallback(
    (templateType: string) => {
      dispatch(setSelectedTemplateType(templateType))
    },
    [dispatch]
  )

  const clearTemplateSelection = useCallback(() => {
    dispatch(clearSelectedTemplateType())
  }, [dispatch])

  return {
    ...templateState,
    loadTemplates,
    loadTemplateConfig,
    selectTemplate,
    clearTemplateSelection,
  }
}
