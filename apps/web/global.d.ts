declare global {
  interface Window {
    gapi: typeof import('gapi-script');
    google: any;
  }

  var gapi: any;
  var google: any;
}

export {};