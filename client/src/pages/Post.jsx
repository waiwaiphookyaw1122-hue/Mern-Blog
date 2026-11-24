import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { PenLine } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useSession } from '../stores/session';
import { dateLabel } from '../lib/utils';
import { Avatar, ErrorBox, Loading, Picture } from '../components/ui';

export default function Post() {
  const { id } = useParams();
  const { user } = useSession();
  const post = useResource(`/posts/${id}`);

  const creatorId =
    typeof post.data?.creator === 'object'
      ? post.data.creator?._id
      : post.data?.creator;

  const author = useResource(creatorId ? `/users/${creatorId}` : null);

  if (post.loading) return <Loading label="Loading article…" />;
  if (post.error) return <ErrorBox message={post.error} retry={post.retry} />;

  const article = post.data;
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(article.description);

  return (
    <article className="article">
      <Link to="/" className="back-link">
        ← Back to all stories
      </Link>

      <header className="article-header">
        <Link
          to={`/categories/${encodeURIComponent(article.category)}`}
          className="category-label"
        >
          {article.category}
        </Link>
        <h1>{article.title}</h1>

        <div className="article-byline">
          <Link className="author-byline" to={`/authors/${creatorId}`}>
            <Avatar user={author.data} />
            <div>
              <div className="font-semibold text-stone-900">
                {author.data?.name || 'Author'}
              </div>
              <div className="text-xs text-stone-500">
                {dateLabel(article.createdAt)}
              </div>
            </div>
          </Link>

          {user?.id === creatorId && (
            <Link to={`/posts/${id}/edit`} className="button button-secondary">
              <PenLine size={15} /> Edit Story
            </Link>
          )}
        </div>
      </header>

      <Picture
        filename={article.thumbnail}
        alt={article.title}
        className="article-cover"
      />

      {containsHtml ? (
        <div
          className="article-body"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(article.description, {
              USE_PROFILES: { html: true },
            }),
          }}
        />
      ) : (
        <div className="article-body plain-body">{article.description}</div>
      )}

      <footer className="article-end">
        <p className="text-stone-600">Written by {author.data?.name || 'Author'}</p>
        <Link to={`/authors/${creatorId}`} className="text-link">
          View more articles from this author →
        </Link>
      </footer>
    </article>
  );
}