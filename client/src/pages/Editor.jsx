import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { postBody } from '../lib/payloads';
import {
  CATEGORIES,
  errorMessage,
  THUMBNAIL_LIMIT,
  validateImage,
} from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import { useForm } from '../hooks/useForm';
import {
  Button,
  Empty,
  ErrorBox,
  Field,
  ImageUpload,
  Loading,
  PageHeading,
  UnsavedChanges,
  UploadProgress,
} from '../components/ui';

export default function Editor() {
  const { id } = useParams();
  const post = useResource(id ? `/posts/${id}` : null);

  if (id && post.loading) return <Loading label="Loading story editor…" />;
  if (id && post.error)
    return <ErrorBox message={post.error} retry={post.retry} />;

  return <EditorForm key={id || 'create'} post={post.data} />;
}

function EditorForm({ post }) {
  const { user, expired } = useSession();
  const defaults = {
    title: post?.title || '',
    category: post?.category || 'Uncategorized',
    description: post?.description || '',
  };

  const form = useForm(defaults);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const abortController = useRef(null);
  const navigate = useNavigate();
  const show = useNotice((state) => state.show);

  const isDirty =
    !done &&
    (Boolean(file) ||
      Object.keys(defaults).some((k) => form.values[k] !== defaults[k]));

  useEffect(() => () => abortController.current?.abort(), []);

  useEffect(() => {
    if (done) navigate('/my-posts');
  }, [done, navigate]);

  const ownerId =
    typeof post?.creator === 'object' ? post.creator?._id : post?.creator;

  if (post && ownerId !== user.id) {
    return (
      <Empty title="Permission Denied">
        You can only edit articles that you created.
        <Link to="/my-posts" className="button button-secondary mt-6">
          Back to My Stories
        </Link>
      </Empty>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (busy || expired) return;

    const { title, category, description } = form.values;
    const validationErrors = {
      ...(!title.trim() ? { title: 'Title is required.' } : {}),
      ...(!CATEGORIES.includes(category)
        ? { category: 'Select a valid category.' }
        : {}),
      ...(description.trim().length < 12
        ? { description: 'Story content must be at least 12 characters.' }
        : {}),
      ...((file || !post) && validateImage(file, THUMBNAIL_LIMIT)
        ? { thumbnail: validateImage(file, THUMBNAIL_LIMIT) }
        : {}),
    };

    if (!form.validate(validationErrors, e.currentTarget)) return;

    setBusy(true);
    setError('');
    setProgress(0);
    abortController.current = new AbortController();

    try {
      const reqConfig = {
        authenticated: true,
        signal: abortController.current.signal,
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      };

      const payload = postBody(form.values, file);

      if (post) {
        await api.patch(`/posts/${post._id}`, payload, reqConfig);
      } else {
        await api.post('/posts', payload, reqConfig);
      }

      show(post ? 'Story updated successfully!' : 'New story published!');
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <UnsavedChanges dirty={isDirty || busy} />
      <Link to="/my-posts" className="back-link">
        ← Back to My Stories
      </Link>

      <PageHeading
        eyebrow={post ? 'Edit Mode' : 'New Publication'}
        title={post ? 'Update your article' : 'Write a new story'}
        description="Share your knowledge, ideas, and perspectives."
      />

      <form className="editor-layout" noValidate onSubmit={handleSave}>
        <div className="editor-main">
          <fieldset disabled={busy}>
            <Field
              label="Article Title"
              placeholder="Enter an engaging headline..."
              {...form.bind('title')}
            />
            <Field
              label="Story Content"
              multiline
              rows={16}
              placeholder="Write your full story here (minimum 12 characters)..."
              {...form.bind('description')}
            />
          </fieldset>
          <ErrorBox message={error} />
        </div>

        <aside className="editor-sidebar">
          <h2>Publishing Settings</h2>
          <fieldset disabled={busy}>
            <Field
              label="Topic Category"
              id="category"
              name="category"
              error={form.errors.category}
            >
              <select
                id="category"
                className="input"
                {...form.bind('category')}
                error={undefined}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>

            <ImageUpload
              label="Cover Thumbnail"
              name="thumbnail"
              file={file}
              onChange={(selected) => {
                setFile(selected);
                form.setErrors((prev) => ({ ...prev, thumbnail: '' }));
              }}
              existing={post?.thumbnail}
              limit={THUMBNAIL_LIMIT}
              error={form.errors.thumbnail}
              disabled={busy}
            />
          </fieldset>

          {busy && file && (
            <UploadProgress
              progress={progress}
              onCancel={() => abortController.current?.abort()}
            />
          )}

          <Button
            type="submit"
            busy={busy}
            disabled={expired}
            className="w-full mt-4"
          >
            {post ? 'Update Story' : 'Publish Now'} <ArrowUpRight size={16} />
          </Button>
          <Link to="/my-posts" className="button button-secondary w-full mt-2">
            Cancel
          </Link>
        </aside>
      </form>
    </>
  );
}