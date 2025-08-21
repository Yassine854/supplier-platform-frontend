import React, { useMemo } from "react";

// Demo rectangle ad (300x250) styled to closely resemble a Google ad tile.
// Tunisian brand examples with royalty-free placeholder images (picsum with stable seeds).
// This is a demo only; not a real ad service.

type DemoAd = {
  advertiser: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  img: string; // 300x250 placeholder image (we will crop/shrink as needed)
};

const DEMO_ADS: DemoAd[] = [
  {
    advertiser: "Ooredoo Tunisie",
    headline: "Offres Internet 4G — Jusqu'à 100 Go",
    description: "Profitez de forfaits adaptés à votre budget, activation instantanée.",
    cta: "Découvrir",
    href: "https://www.ooredoo.tn/",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo-48HWwWceOEjrVc8OdAzIxjSR1jhbezBwQ&s",
  },
  {
    advertiser: "Carrefour Tunisie",
    headline: "Promos Semaine — Jusqu'à -40%",
    description: "Épicerie, frais, électroménager et plus à petits prix.",
    cta: "Voir offres",
    href: "https://www.carrefourtunisie.com/",
    img: "https://www.generixgroup.com/wp-content/uploads/2023/12/carrefour.jpeg",
  },
  {
    advertiser: "BIAT",
    headline: "Ouvrez votre compte en ligne",
    description: "Des solutions bancaires simples et rapides, 100% en ligne.",
    cta: "Commencer",
    href: "https://www.biat.com.tn/",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7YU_L98oG6jNiFHFmzDwKXnLFieZXZnxrcA&s",
  },
  {
    advertiser: "Attijari Bank Tunisie",
    headline: "Crédit conso — TAEG attractif",
    description: "Financez vos projets avec des mensualités adaptées.",
    cta: "Simuler",
    href: "https://www.attijaribank.com.tn/",
    img: "https://www.attijaribank.com.tn/sites/default/files/2025-01/Actualite-loi.jpg",
  },

];

export default function FakeAdBanner() {
  const ad = useMemo(() => DEMO_ADS[Math.floor(Math.random() * DEMO_ADS.length)], []);

  const containerStyle: React.CSSProperties = {
    display: "block",
    width: 280,
    height: 400,
    backgroundColor: "#fff",
    border: "1px solid #dadce0", // Google-ish gray border
    margin: "20px auto",
    overflow: "hidden",
    borderRadius: 8,
    position: "relative",
    fontFamily: "Arial, sans-serif",
    color: "#202124",
  };

  const topBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: 8,
    background: "#f1f3f4",
    color: "#5f6368",
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 10,
    zIndex: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    border: "1px solid #e0e0e0",
  };

  const infoStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "1px solid #dadce0",
    color: "#5f6368",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    background: "#fff",
    zIndex: 2,
  };

  const contentWrapStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    padding: 12,
    display: "flex",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    boxSizing: "border-box",
  };

  const textColStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const advertiserStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#5f6368",
    marginBottom: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
    marginBottom: 6,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#3c4043",
    lineHeight: 1.35,
    marginBottom: 10,
    maxHeight: 36,
    overflow: "hidden",
  };

  const ctaStyle: React.CSSProperties = {
    display: "inline-block",
    alignSelf: "flex-start",
    background: "#1a73e8",
    color: "#fff",
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 4,
    textDecoration: "none",
  };

  const imageWrapStyle: React.CSSProperties = {
    width: 160,
    height: 150,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid #eee",
  };

  const linkStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    // Entire rectangle clickable (except the info chip if desired)
    zIndex: 1,
  };

  return (
    <div style={containerStyle}>
      {/* <div style={topBadgeStyle}>Ad</div> */}
      <div style={infoStyle}>i</div>

      <div style={contentWrapStyle}>
        {/* Text column */}
        <div style={textColStyle}>
          <div style={advertiserStyle}>{ad.advertiser}</div>
          <div style={headlineStyle}>{ad.headline}</div>
          <div style={descStyle}>{ad.description}</div>
          <a href={ad.href} target="_blank" rel="noopener noreferrer" style={ctaStyle}>
            {ad.cta}
          </a>
        </div>

        {/* Image column */}
        <div style={imageWrapStyle}>
          <img
            src={ad.img}
            alt={ad.advertiser}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Make the whole ad clickable as well */}
      <a href={ad.href} target="_blank" rel="noopener noreferrer" aria-label={`${ad.advertiser} - ${ad.headline}`} style={linkStyle}></a>
    </div>
  );
}
