import { Navigate, type RouteObject } from 'react-router'
import AdminPage from '@/features/admin/AdminPage'
import MyRequestsPage from '@/features/my-requests/MyRequestsPage'
import MyWorkPage from '@/features/my-work/MyWorkPage'
import ProjectsPage from '@/features/projects/ProjectsPage'
import QueuesPage from '@/features/queues/QueuesPage'
import { AppShell } from './AppShell'
import NotFoundPage from './NotFoundPage'
import { RouteError } from './RouteError'

/** Every screen in the app. Tests build their own router from this list. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        // A screen that crashes shows an error inside the shell, not a blank page.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Navigate to="/my-work" replace /> },
          { path: 'my-work', element: <MyWorkPage /> },
          { path: 'my-requests', element: <MyRequestsPage /> },
          { path: 'queues', element: <QueuesPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'admin', element: <AdminPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
