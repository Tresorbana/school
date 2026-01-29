// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './utils/context/ToastContext.tsx'
import { AuthProvider } from './utils/context/AuthContext.tsx'
import { ApiProvider } from './components/providers/ApiProvider.tsx'
import { Provider } from 'react-redux'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  // </StrictMode>,

  <Provider store={store}>
    <ToastProvider>
      <AuthProvider>
        <ApiProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ApiProvider>
      </AuthProvider>
    </ToastProvider>
  </Provider>
)
