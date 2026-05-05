(() => {
  const articles = [
    {
      file: "clb_awards_predictions.html",
      title: "Champions League Awards Predictions: Start With Magic, Then Start Arguing",
      category: "Analysis",
      blurb: "Damon Cross opens the preseason awards cycle with Magic Johnson, Artis Gilmore, and a star-heavy CLB first team."
    },
    {
      file: "elb_awards_predictions.html",
      title: "Europa League Awards Predictions: Big Men, Big Stakes, No Apologies",
      category: "Analysis",
      blurb: "The Europa board leans into Moses Malone, Robert Parish, and a brutal frontcourt race at the heart of the tier."
    },
    {
      file: "ecl_awards_predictions.html",
      title: "Conference League Awards Predictions: This Tier Is Messy, So Let?s Be Honest",
      category: "Analysis",
      blurb: "The Conference League awards picture starts with Isiah Thomas, Alton Lister, and a first team built for volatility."
    },
    {
      file: "clb_power_rankings.html",
      title: "Champions League Power Rankings: Richmond opens at No. 1",
      category: "Analysis",
      blurb: "The first Champions League board weighs the six-game form lines against star-loaded rosters."
    },
    {
      file: "elb_power_rankings.html",
      title: "Europa League Power Rankings: Chelsea earns the first top line",
      category: "Analysis",
      blurb: "Chelsea's 5-1 opening run gives them the edge in the deepest middle tier on the site."
    },
    {
      file: "ecl_power_rankings.html",
      title: "Conference League Power Rankings: Manchester City takes the first board",
      category: "Analysis",
      blurb: "In the most volatile tier, early results matter most and City gets rewarded for a 5-1 launch."
    }
  ];

  const adImages = [
    "../Ads/ChatGPT Image May 5, 2026, 10_04_21 PM (1).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_04_21 PM (2).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_04_21 PM (3).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_04_24 PM (1).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_04_24 PM (2).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_04_25 PM (3).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_15 PM (1).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_15 PM (2).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_15 PM (3).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_21 PM (1).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_21 PM (2).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_05_21 PM (3).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_48 PM (1).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_48 PM (2).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_48 PM (3).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_48 PM (4).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_49 PM (5).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_49 PM (6).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_49 PM (7).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_49 PM (8).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_49 PM (9).png",
    "../Ads/ChatGPT Image May 5, 2026, 10_22_50 PM (10).png"
  ];

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const pickRandom = (items, count) => shuffle(items).slice(0, count);

  const buildRecommendations = (currentArticle) => {
    const pool = articles.filter((article) => article.file !== currentArticle.file);
    const sameCategory = pool.filter((article) => article.category === currentArticle.category);
    const others = pool.filter((article) => article.category !== currentArticle.category);
    return [...shuffle(sameCategory), ...shuffle(others)].slice(0, 3);
  };

  const createAdCard = (src, index) => {
    const card = document.createElement("section");
    card.className = "article-rail-card article-ad-card";
    card.innerHTML = `
      <div class="article-rail-label">Advertisement</div>
      <img src="${src}" alt="ESL sponsor creative ${index + 1}" loading="lazy">
    `;
    return card;
  };

  const createRecommendationCard = (recommendations) => {
    const card = document.createElement("section");
    card.className = "article-rail-card article-rec-card";

    const items = recommendations.map((article) => `
      <li class="article-rec-item">
        <a href="${article.file}" class="article-rec-link">${article.title}</a>
        <div class="article-rec-meta">${article.category}</div>
        <p class="article-rec-blurb">${article.blurb}</p>
      </li>
    `).join("");

    card.innerHTML = `
      <div class="article-rail-head">
        <div class="article-rail-title">Recommended</div>
        <div class="article-rail-note">More from ESL Media</div>
      </div>
      <ul class="article-rec-list">${items}</ul>
    `;

    return card;
  };

  const initRail = () => {
    const body = document.body;
    if (!body || !body.classList.contains("media-article")) return;

    const paper = document.querySelector(".paper");
    if (!paper || paper.closest(".article-shell")) return;

    const currentFile = window.location.pathname.split("/").pop();
    const currentArticle = articles.find((article) => article.file === currentFile) || articles[0];
    const recommendations = buildRecommendations(currentArticle);
    const adSelection = pickRandom(adImages, Math.min(2, adImages.length));

    const shell = document.createElement("div");
    shell.className = "article-shell";

    const rail = document.createElement("aside");
    rail.className = "article-rail";
    rail.append(
      createRecommendationCard(recommendations),
      ...adSelection.map((src, index) => createAdCard(src, index))
    );

    paper.parentNode.insertBefore(shell, paper);
    shell.appendChild(paper);
    shell.appendChild(rail);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRail, { once: true });
  } else {
    initRail();
  }
})();
