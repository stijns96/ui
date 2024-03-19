import { inject, ref, computed } from 'vue'
import { type UseEventBusReturn, useDebounceFn } from '@vueuse/core'
import type { FormEvent, FormInputEvents, InjectedFormFieldOptions, InjectedFormOptions } from '../types/form'

type InputProps = {
  id?: string | number
  size?: string | number | symbol
  color?: string // FIXME: Replace by enum
  name?: string
  eagerValidation?: boolean
  legend?: string | null
  disabled?: boolean | null
}

export const useFormField = (inputProps?: InputProps) => {
  const formOptions = inject<InjectedFormOptions | undefined>('form-options', undefined)
  const formBus = inject<UseEventBusReturn<FormEvent, string> | undefined>('form-events', undefined)
  const formField = inject<InjectedFormFieldOptions | undefined>('form-field', undefined)
  const formInputs = inject<any>('form-inputs', undefined)

  if (formField) {
    if (inputProps?.id) {
      // Updates for="..." attribute on label if inputProps.id is provided
      formField.inputId.value = inputProps?.id
    }

    if (formInputs) {
      formInputs.value[formField.name.value] = formField.inputId.value
    }
  }

  const blurred = ref(false)

  function emitFormEvent (type: FormInputEvents, name: string) {
    if (formBus && formField) {
      formBus.emit({ type, name })
    }
  }

  function emitFormBlur () {
    emitFormEvent('blur', formField?.name.value as string)
    blurred.value = true
  }

  function emitFormChange () {
    emitFormEvent('change', formField?.name.value as string)
  }

  const emitFormInput = useDebounceFn(
    () => {
      if (blurred.value || formField?.eagerValidation.value) {
        emitFormEvent('input', formField?.name.value as string)
      }
    },
    formField?.validateOnInputDelay.value ??
    formOptions?.validateOnInputDelay.value ??
    0
  )

  return {
    inputId: computed(() => inputProps?.id ?? formField?.inputId.value),
    name: computed(() => inputProps?.name ?? formField?.name.value),
    size: computed(() => inputProps?.size ?? formField?.size?.value),
    color: computed(() => formField?.error?.value ? 'red' : inputProps?.color),
    disabled: computed(() => formOptions?.disabled?.value || inputProps?.disabled),
    emitFormBlur,
    emitFormInput,
    emitFormChange
  }
}
