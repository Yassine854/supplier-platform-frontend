import { useEffect, useRef } from "react";

interface AdProps {
  adUnitPath: string;
  sizeMapping: { viewport: [number, number]; slot: [number, number] }[];
  nativeTemplateId?: string;
}

declare global {
  interface Window {
    googletag: any;
  }
}

export default function GoogleAd({ adUnitPath, sizeMapping, nativeTemplateId }: AdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!adRef.current || initialized.current) return;
    initialized.current = true;

    if (!window.googletag) {
      const gptScript = document.createElement("script");
      gptScript.src = "https://www.googletagservices.com/tag/js/gpt.js";
      gptScript.async = true;
      document.head.appendChild(gptScript);
      window.googletag = window.googletag || { cmd: [] };
    }

    window.googletag.cmd.push(() => {
      const slot = window.googletag
        .defineSlot(adUnitPath, sizeMapping[0].slot, adRef.current!.id)
        .addService(window.googletag.pubads());

      if (sizeMapping.length > 1) {
        const sm = window.googletag.sizeMapping();
        sizeMapping.forEach((map) => sm.addSize(map.viewport, map.slot));
        slot.defineSizeMapping(sm.build());
      }

      if (nativeTemplateId) {
        slot.setTargeting("native_template_id", nativeTemplateId);
      }

      window.googletag.pubads().enableSingleRequest();
      window.googletag.enableServices();
      window.googletag.display(adRef.current!.id);
    });
  }, [adUnitPath, sizeMapping, nativeTemplateId]);

  // Use a stable ID
  return <div id={`ad-${adUnitPath.replace(/\W/g, "")}`} ref={adRef}></div>;
}
