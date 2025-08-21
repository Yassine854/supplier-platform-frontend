import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdBanner() {
  useEffect(() => {
    // Add the script if not already present
    if (!document.querySelector("#adsbygoogle-js")) {
      const script = document.createElement("script");
      script.id = "adsbygoogle-js";
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Push the ad
    const timeout = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "300px", height: "250px", backgroundColor: "#f0f0f0" }}
        data-ad-client="ca-pub-8913041961914313" // Google test account
        data-ad-slot="2331546993"              // Google test ad slot
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
