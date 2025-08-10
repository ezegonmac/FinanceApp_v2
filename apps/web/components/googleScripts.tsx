import Script from "next/script";

export default function GoogleScripts() {
    return (
    <>
        <Script
        src="https://apis.google.com/js/api.js"
        strategy="afterInteractive"
        onLoad={() => window.gapiLoaded()}
        />
        <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => window.gisLoaded()}
        />
    </>
    );
}
