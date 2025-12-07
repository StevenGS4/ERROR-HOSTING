import { configureStore } from '@reduxjs/toolkit'
import errorsReducer from '../store/errorsSlice'

export const store = configureStore({
  reducer: {
    errors: errorsReducer
  }
})
