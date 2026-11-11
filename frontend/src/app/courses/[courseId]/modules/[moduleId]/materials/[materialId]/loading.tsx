import { ReaderRouteLoading } from "../../../../../../../components/content/document-skeleton.tsx";

// Shown while a material route loads: the reader's return link and the same document skeleton.
export default function Loading() {
  return <ReaderRouteLoading reader="material" />;
}
