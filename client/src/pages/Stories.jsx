import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { CATEGORIES } from '../lib/utils';
import { Empty, ErrorBox, Loading, PageHeading } from '../components/ui';
import PostCard from '../components/PostCard';

export default function Stories() {
  const { category } = useParams();
  const isValidCategory = !category || CATEGORIES.includes(category);

  const posts = useResource(
    isValidCategory
      ? category
        ? `/posts/categories/${encodeURIComponent(category)}`
        : '/posts'
      : null,
  );
  const authors = useResource('/users');

  const authorLookup = Object.fromEntries(
    (authors.data || []).map((a) => [a._id, a]),
  );

  const getAuthor = (post) =>
    authorLookup[
      typeof post.creator === 'object' ? post.creator?._id : post.creator
    ];

  return (
    <>
      {category ? (
        <PageHeading
          eyebrow="Category Archive"
          title={category}
          description={` curated articles and insights filed under ${category}.`}
        />
      ) : (
        <section className="hero-banner">
          <div>
            <p className="eyebrow">
              <Sparkles size={14} className="inline mr-1" /> Community Journal
            </p>
            <h1>
              Thoughtful writing for
              <br />
              <span>curious minds.</span>
            </h1>
          </div>
          <div className="hero-side">
            <p>
              Explore independent perspectives across art, education, business,
              and technology.
            </p>
            <Link to="/authors" className="text-link mt-4">
              Browse our writers <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <nav className="category-nav" aria-label="Categories">
        <Link to="/" aria-current={!category ? 'page' : undefined}>
          All Topics
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to={`/categories/${encodeURIComponent(cat)}`}
            aria-current={category === cat ? 'page' : undefined}
          >
            {cat}
          </Link>
        ))}
      </nav>

      {!isValidCategory ? (
        <Empty title="Category not found">
          Please select one of the available categories above.
        </Empty>
      ) : posts.loading ? (
        <Loading label="Loading stories…" />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="No stories published here yet">
          Be the first writer to share a story in this space.
          <Link to="/write" className="button button-primary mt-6">
            Start writing <ArrowRight size={16} />
          </Link>
        </Empty>
      ) : (
        <>
          {!category && (
            <div className="mb-12">
              <div className="section-label">
                <span>Featured Story</span>
                <span>Latest publication</span>
              </div>
              <PostCard
                post={posts.data[0]}
                author={getAuthor(posts.data[0])}
                featured
              />
            </div>
          )}

          {(category ? posts.data : posts.data.slice(1)).length > 0 && (
            <section className="stories-section">
              <div className="section-heading">
                <h2>{category ? `${category} Stories` : 'Recent Articles'}</h2>
                <span>
                  {(category ? posts.data : posts.data.slice(1)).length} posts
                </span>
              </div>
              <div className="post-grid">
                {(category ? posts.data : posts.data.slice(1)).map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    author={getAuthor(post)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}