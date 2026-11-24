import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import {
  Avatar,
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
} from '../components/ui';
import PostCard from '../components/PostCard';

export function Authors() {
  const { data, loading, error, retry } = useResource('/users');

  return (
    <>
      <PageHeading
        eyebrow="Contributors"
        title="Meet Our Writers"
        description="Discover the authors sharing their knowledge and stories."
      />
      {loading ? (
        <Loading label="Loading authors…" />
      ) : error ? (
        <ErrorBox message={error} retry={retry} />
      ) : !data?.length ? (
        <Empty title="No registered authors yet">
          Sign up to become the first contributor on Inkwell.
        </Empty>
      ) : (
        <div className="authors-grid">
          {data.map((writer) => (
            <Link
              key={writer._id}
              to={`/authors/${writer._id}`}
              className="author-tile"
            >
              <Avatar user={writer} size="large" />
              <h2>{writer.name}</h2>
              <span className="text-sm text-stone-500">
                {writer.posts || 0}{' '}
                {(writer.posts || 0) === 1 ? 'published post' : 'published posts'}
              </span>
              <span className="text-link mt-2">
                Read profile <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function Author() {
  const { id } = useParams();
  const author = useResource(`/users/${id}`);
  const posts = useResource(`/posts/users/${id}`);

  if (author.loading) return <Loading label="Loading profile…" />;
  if (author.error)
    return <ErrorBox message={author.error} retry={author.retry} />;

  return (
    <>
      <Link to="/authors" className="back-link">
        ← All Authors
      </Link>

      <section className="author-profile">
        <Avatar user={author.data} size="large" />
        <p className="eyebrow mt-3">Writer Profile</p>
        <h1>{author.data.name}</h1>
        <p className="text-stone-600">
          {author.data.posts || 0} published{' '}
          {(author.data.posts || 0) === 1 ? 'story' : 'stories'}
        </p>
      </section>

      <div className="section-heading">
        <h2>Articles by {author.data.name}</h2>
      </div>

      {posts.loading ? (
        <Loading />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="No posts published yet">
          This writer has not published any articles yet.
        </Empty>
      ) : (
        <div className="post-grid">
          {posts.data.map((post) => (
            <PostCard key={post._id} post={post} author={author.data} />
          ))}
        </div>
      )}
    </>
  );
}