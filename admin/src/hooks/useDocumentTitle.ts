import { useEffect } from "react";

const titleSuffix = " | Maps Content Admin";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (!title) {
      return;
    }
    document.title = `${title}${titleSuffix}`;
  }, [title]);
}
