import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, PenLine, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { dateLabel, errorMessage } from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import {
  Button,
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHeading,
  Picture,
} from '../components/ui';

export default function MyPosts() {
  const { user, expired } = useSession();
  const posts = useResource(`/posts/users/${user.id}`);
  const [targetPost, setTargetPost] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const show = useNotice((state) => state.show);

  async function handleDelete() {
    if (busy || expired || !targetPost) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/posts/${targetPost._id}`, { authenticated: true });
      setTargetPost(null);
      posts.retry();
      show('Story permanently deleted.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Author Dashboard"
        title="My Stories"
        description={`Manage articles published by ${user.name}.`}
        action={
          <Link to="/write" className="button button-primary">
            <PenLine size={16} /> Write New Story
          </Link>
        }
      />

      {posts.loading ? (
        <Loading label="Loading your articles…" />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="You haven't published any stories yet">
          Share your first article with the community.
          <Link to="/write" className="button button-primary mt-6">
            Create First Post <ArrowUpRight size={16} />
          </Link>
        </Empty>
      ) : (
        <div className="manage-list">
          {posts.data.map((post) => (
            <article key={post._id} className="manage-row">
              <Link to={`/posts/${post._id}`} className="manage-cover">
                <Picture filename={post.thumbnail} />
              </Link>
              <div className="manage-info">
                <Link
                  to={`/categories/${encodeURIComponent(post.category)}`}
                  className="category-label"
                >
                  {post.category}
                </Link>
                <h2>
                  <Link to={`/posts/${post._id}`}>{post.title}</Link>
                </h2>
                <p className="text-sm text-stone-500">
                  Published on {dateLabel(post.createdAt)}
                </p>
              </div>
              <div className="manage-actions">
                <Link
                  to={`/posts/${post._id}/edit`}
                  className="button button-secondary"
                >
                  <PenLine size={15} /> Edit
                </Link>
                <button
                  type="button"
                  className="icon-button danger-icon"
                  disabled={expired}
                  onClick={() => {
                    setTargetPost(post);
                    setError('');
                  }}
                  title="Delete Story"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(targetPost)}
        title="Confirm Story Deletion"
        busy={busy}
        onClose={() => setTargetPost(null)}
        actions={
          <Button
            variant="danger"
            busy={busy}
            disabled={expired}
            onClick={handleDelete}
          >
            Delete Permanently
          </Button>
        }
      >
        <p>
          Are you sure you want to delete <strong>{targetPost?.title}</strong>?
          This action cannot be undone.
        </p>
        <ErrorBox message={error} />
      </Modal>
    </>
  );
}