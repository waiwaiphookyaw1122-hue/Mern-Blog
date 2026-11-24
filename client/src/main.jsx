import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
  useLocation,
  useRouteError,
} from 'react-router-dom';
import Layout from './components/Layout';
import { Empty } from './components/ui';
import Stories from './pages/Stories';
import { Author, Authors } from './pages/Authors';
import Post from './pages/Post';
import Auth from './pages/Auth';
import Editor from './pages/Editor';
import MyPosts from './pages/MyPosts';
import Profile from './pages/Profile';
import { useSession } from './stores/session';
import './styles.css';

function Protected({ children }) {
  const user = useSession((state) => state.user);
  const location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

function Logout() {
  const logout = useSession((state) => state.logout);
  useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/" replace />;
}

function RouteError() {
  const err = useRouteError();
  return (
    <div className="shell py-20">
      <Empty title="Something went wrong">
        {err?.status === 404
          ? 'The requested page does not exist.'
          : 'Please refresh the browser and try again.'}
        <a href="/" className="button button-primary mt-6">
          Return Home
        </a>
      </Empty>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Stories /> },
      { path: 'categories/:category', element: <Stories /> },
      { path: 'authors', element: <Authors /> },
      { path: 'authors/:id', element: <Author /> },
      { path: 'posts/:id', element: <Post /> },
      { path: 'login', element: <Auth key="login" /> },
      { path: 'register', element: <Auth register key="register" /> },
      { path: 'logout', element: <Logout /> },
      {
        path: 'my-posts',
        element: (
          <Protected>
            <MyPosts />
          </Protected>
        ),
      },
      {
        path: 'write',
        element: (
          <Protected>
            <Editor />
          </Protected>
        ),
      },
      {
        path: 'posts/:id/edit',
        element: (
          <Protected>
            <Editor />
          </Protected>
        ),
      },
      {
        path: 'profile',
        element: (
          <Protected>
            <Profile />
          </Protected>
        ),
      },
      {
        path: '*',
        element: (
          <Empty title="404 — Page Not Found">
            We could not find the page you were looking for.
            <Link to="/" className="button button-primary mt-6">
              Back to Stories
            </Link>
          </Empty>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);