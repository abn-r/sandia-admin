"use client";

import { useEffect, useRef } from "react";

type AutoSubmitFiltersFormProps = React.ComponentProps<"form"> & {
  searchFieldNames?: string[];
  searchDebounceMs?: number;
  changeDebounceMs?: number;
  minSearchChars?: number;
};

export function AutoSubmitFiltersForm({
  children,
  searchFieldNames = ["search", "q"],
  searchDebounceMs = 350,
  changeDebounceMs = 220,
  minSearchChars = 2,
  onChange,
  ...props
}: AutoSubmitFiltersFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function clearDebounce() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function normalizeParams(params: URLSearchParams) {
    const entries = Array.from(params.entries())
      .filter(([key]) => key !== "page")
      .sort(([aKey, aValue], [bKey, bValue]) => {
        if (aKey === bKey) {
          return aValue.localeCompare(bValue, "es");
        }
        return aKey.localeCompare(bKey, "es");
      });

    return new URLSearchParams(entries).toString();
  }

  function buildNextParams(form: HTMLFormElement) {
    const formData = new FormData(form);
    const nextParams = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") {
        continue;
      }

      const normalizedValue = value.trim();

      if (!normalizedValue || normalizedValue === "all") {
        continue;
      }

      if (searchFieldNames.includes(key) && normalizedValue.length < minSearchChars) {
        continue;
      }

      nextParams.append(key, normalizedValue);
    }

    return nextParams;
  }

  function shouldSubmit(form: HTMLFormElement) {
    if (typeof window === "undefined") {
      return true;
    }

    const actionPath = new URL(form.action || window.location.pathname, window.location.origin).pathname;
    const currentPath = window.location.pathname;

    if (actionPath !== currentPath) {
      return true;
    }

    const currentParams = new URLSearchParams(window.location.search);
    const nextParams = buildNextParams(form);

    return normalizeParams(currentParams) !== normalizeParams(nextParams);
  }

  function submitDebounced(delayMs: number) {
    clearDebounce();

    debounceRef.current = setTimeout(() => {
      const form = formRef.current;
      if (!form) {
        return;
      }
      if (!shouldSubmit(form)) {
        return;
      }
      form.requestSubmit();
    }, delayMs);
  }

  function handleAutoSubmit(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target instanceof HTMLSelectElement) {
      submitDebounced(changeDebounceMs);
      return;
    }

    if (target instanceof HTMLTextAreaElement) {
      submitDebounced(searchDebounceMs);
      return;
    }

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.type === "text" || target.type === "search") {
      if (searchFieldNames.includes(target.name)) {
        submitDebounced(searchDebounceMs);
      } else {
        submitDebounced(changeDebounceMs);
      }
      return;
    }

    if (target.type !== "hidden" && target.type !== "submit" && target.type !== "button") {
      submitDebounced(changeDebounceMs);
    }
  }

  return (
    <form
      ref={formRef}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) {
          return;
        }
        handleAutoSubmit(event.target);
      }}
      {...props}
    >
      {children}
    </form>
  );
}
