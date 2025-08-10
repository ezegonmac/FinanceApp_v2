declare global {
  interface Window {
    gapiLoaded: (() => void) | undefined;
    gisLoaded: (() => void) | undefined;
  }
}

export {};