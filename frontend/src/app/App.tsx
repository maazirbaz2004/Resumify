import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <RouterProvider router={router} />
      </DarkModeProvider>
    </AuthProvider>
  );
}