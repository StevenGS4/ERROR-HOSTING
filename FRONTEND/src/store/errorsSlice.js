import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit'
import { fetchErrors, createError, updateError } from '../services/errorService'

// Thunks
export const loadErrors = createAsyncThunk('errors/load', async (_, { rejectWithValue }) => {
  try {
    const { ok, rows, message } = await fetchErrors()
    if (!ok) return rejectWithValue(message || 'Error al cargar')
    return rows
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

export const addError = createAsyncThunk('errors/add', async (payload, { rejectWithValue }) => {
  try {
    const { ok, rows, message } = await createError(payload)
    if (!ok) return rejectWithValue(message || 'Error al crear')
    return Array.isArray(rows) ? rows[0] : rows
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

export const editError = createAsyncThunk('errors/edit', async (payload, { rejectWithValue }) => {
  try {
    const { ok, rows, message } = await updateError(payload)
    if (!ok) return rejectWithValue(message || 'Error al actualizar')
    return Array.isArray(rows) ? rows[0] : rows
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

const errorsSlice = createSlice({
  name: 'errors',
  initialState: {
    items: [],
    loading: false,
    error: null,
    selected: null
  },
  reducers: {
    selectError: (state, action) => { state.selected = action.payload },
    // Optimistic add (opcional)
    addLocal: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(partial) {
        return { payload: { _id: nanoid(), STATUS: 'NEW', ...partial } }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadErrors.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loadErrors.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || [] })
      .addCase(loadErrors.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message })

      .addCase(addError.pending, (s) => { s.loading = true; s.error = null })
      .addCase(addError.fulfilled, (s, a) => { s.loading = false; a.payload && s.items.unshift(a.payload) })
      .addCase(addError.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message })

      .addCase(editError.pending, (s) => { s.loading = true; s.error = null })
      .addCase(editError.fulfilled, (s, a) => {
        s.loading = false
        const updated = a.payload
        if (!updated?._id) return
        const idx = s.items.findIndex(x => String(x._id) === String(updated._id))
        if (idx >= 0) s.items[idx] = updated
      })
      .addCase(editError.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message })
  }
})

export const { selectError, addLocal } = errorsSlice.actions
export default errorsSlice.reducer
