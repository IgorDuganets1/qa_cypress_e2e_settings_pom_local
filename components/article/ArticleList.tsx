import styled from "@emotion/styled";
import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";

import ArticlePreview from "components/article/ArticlePreview";
import ErrorMessage from "components/common/ErrorMessage";
import LoadingSpinner from "components/common/LoadingSpinner";
import Maybe from "components/common/Maybe";
import Pagination from "components/common/Pagination";
import { usePageState } from "lib/context/PageContext";
import {
  usePageCountState,
  usePageCountDispatch,
} from "lib/context/PageCountContext";
import { SERVER_BASE_URL, DEFAULT_LIMIT } from "lib/utils/constant";
import fetcher from "lib/utils/fetcher";

const EmptyMessage = styled("div")`
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1.5rem 0;
`;

const ArticleList = (props) => {
  const page = usePageState();
  const pageCount = usePageCountState();
  const setPageCount = usePageCountDispatch();
  const lastIndex =
    pageCount > 480 ? Math.ceil(pageCount / 20) : Math.ceil(pageCount / 20) - 1;
  const router = useRouter();
  const { asPath, pathname, query } = router;
  const { favorite, follow, tag, pid } = query;
  let fetchURL = (() => {
    switch (props.what) {
      case 'favorites':
        return `${SERVER_BASE_URL}/articles?favorited=${encodeURIComponent(
          String(pid)
        )}&offset=${page * DEFAULT_LIMIT}`
      case 'my-posts':
        return `${SERVER_BASE_URL}/articles?author=${encodeURIComponent(
          String(pid)
        )}&offset=${page * DEFAULT_LIMIT}`;
      case 'tag':
        return `${SERVER_BASE_URL}/articles?tag=${encodeURIComponent(props.tag)}&offset=${
          page * DEFAULT_LIMIT
        }`;
      case 'feed':
        return `${SERVER_BASE_URL}/articles/feed?offset=${
          page * DEFAULT_LIMIT
        }`;
      case 'global':
        return `${SERVER_BASE_URL}/articles?offset=${page * DEFAULT_LIMIT}`;
      default:
        throw new Error(`Unknown search: ${props.what}`)
    }
  })()
  const { data, error } = useSWR(fetchURL, fetcher);
  const { articles, articlesCount } = data || {
    articles: [],
    articlesCount: 0,
  };
  React.useEffect(() => {
    setPageCount(articlesCount);
  }, [articlesCount]);
  if (error) return <ErrorMessage message="Cannot load recent articles..." />;
  if (!data) return <LoadingSpinner />;
  if (articles?.length === 0) {
    return <EmptyMessage>No articles are here... yet.</EmptyMessage>;
  }
  return (
    <>
      {articles?.map((article) => (
        <ArticlePreview key={article.slug} article={article} />
      ))}
      <Maybe test={articlesCount && articlesCount > 20}>
        <Pagination
          total={pageCount}
          limit={20}
          pageCount={10}
          currentPage={page}
          lastIndex={lastIndex}
          fetchURL={fetchURL}
        />
      </Maybe>
    </>
  );
};

export default ArticleList;