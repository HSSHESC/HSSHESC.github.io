/**
 * Template Name: DevFolio - v4.10.0
 * Author: BootstrapMade.com
 * License: https://bootstrapmade.com/license/
 */
(async function () {
  "use strict";

  if (window.ESC_SITE_CONTENT_READY) {
    await window.ESC_SITE_CONTENT_READY;
  }

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  const onWindowLoad = (callback) => {
    if (document.readyState === "complete") {
      callback();
      return;
    }

    window.addEventListener("load", callback, { once: true });
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getSafeUrl = (value, allowedProtocols = ["https:"]) => {
    if (!value) return "";

    try {
      const url = new URL(value, window.location.href);
      return allowedProtocols.includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all);
    if (selectEl) {
      if (all) {
        selectEl.forEach((e) => e.addEventListener(type, listener));
      } else {
        selectEl.addEventListener(type, listener);
      }
    }
  };

  /**
   * Easy on scroll event listener
   */
  const onscroll = (el, listener) => {
    el.addEventListener("scroll", listener);
  };

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select("#navbar .scrollto", true);
  const navbarlinksActive = () => {
    let position = window.scrollY + 200;
    navbarlinks.forEach((navbarlink) => {
      if (!navbarlink.hash) return;
      let section = select(navbarlink.hash);
      if (!section) return;
      if (
        position >= section.offsetTop &&
        position <= section.offsetTop + section.offsetHeight
      ) {
        navbarlink.classList.add("active");
      } else {
        navbarlink.classList.remove("active");
      }
    });
  };
  onWindowLoad(navbarlinksActive);
  onscroll(document, navbarlinksActive);

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select("#header");
    let offset = header.offsetHeight;

    if (!header.classList.contains("header-scrolled")) {
      offset -= 16;
    }

    let elementPos = select(el).offsetTop;
    window.scrollTo({
      top: elementPos - offset,
      behavior: "smooth",
    });
  };

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select("#header");
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add("header-scrolled");
      } else {
        selectHeader.classList.remove("header-scrolled");
      }
    };
    onWindowLoad(headerScrolled);
    onscroll(document, headerScrolled);
  }

  /**
   * Back to top button
   */
  let backtotop = select(".back-to-top");
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add("active");
      } else {
        backtotop.classList.remove("active");
      }
    };
    onWindowLoad(toggleBacktotop);
    onscroll(document, toggleBacktotop);
  }

  /**
   * Mobile nav toggle
   */
  on("click", ".mobile-nav-toggle", function () {
    select("#navbar").classList.toggle("navbar-mobile");
    this.classList.toggle("bi-list");
    this.classList.toggle("bi-x");
  });

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on(
    "click",
    ".scrollto",
    function (e) {
      if (select(this.hash)) {
        e.preventDefault();

        let navbar = select("#navbar");
        if (navbar.classList.contains("navbar-mobile")) {
          navbar.classList.remove("navbar-mobile");
          let navbarToggle = select(".mobile-nav-toggle");
          navbarToggle.classList.toggle("bi-list");
          navbarToggle.classList.toggle("bi-x");
        }
        scrollto(this.hash);
      }
    },
    true,
  );

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  onWindowLoad(() => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash);
      }
    }
  });

  /**
   * Intro type effect
   */
  const typed = select(".typed");
  if (typed && typeof window.Typed === "function") {
    let typedItems = [];
    try {
      typedItems = JSON.parse(typed.dataset.typedItemsJson ?? "[]");
    } catch (error) {
      console.error("움직이는 단어 설정을 읽지 못했습니다.", error);
    }
    if (!Array.isArray(typedItems) || !typedItems.length) {
      typedItems = (typed.dataset.typedItems ?? "ESC")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    new window.Typed(".typed", {
      strings: typedItems,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000,
    });
  }

  /**
   * Portfolio items
   */
  const portfolioItems = select("#portfolioItems");
  if (portfolioItems) {
    const initializePortfolio = async () => {
      let portfolioData = [];
      const getPortfolioImages = (item) => item.images ?? [];
      const getPortfolioImageCaptions = (item) =>
        item.imageCaptions ?? getPortfolioImages(item).map(() => item.title);

      portfolioItems.innerHTML = `
                <div class="col-12 py-5 text-center text-muted" role="status">
                    활동 기록을 불러오는 중입니다.
                </div>
            `;

      try {
        if (!window.ESC_ACTIVITIES?.loadPublished) {
          throw new Error("Supabase activity loader is unavailable.");
        }

        portfolioData = await window.ESC_ACTIVITIES.loadPublished();
      } catch (error) {
        console.error("Supabase 활동 데이터를 불러오지 못했습니다.", error);
        portfolioItems.innerHTML = `
                    <div class="col-12 py-5 text-center text-muted" role="alert">
                        활동 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                    </div>
                `;
        return;
      }

      if (!portfolioData.length) {
        portfolioItems.innerHTML = `
                    <div class="col-12 py-5 text-center text-muted">
                        공개된 활동 기록이 없습니다.
                    </div>
                `;
        return;
      }

      portfolioItems.innerHTML = portfolioData
        .map((item, itemIndex) => {
          const images = getPortfolioImages(item);
          const imageCaptions = getPortfolioImageCaptions(item);
          const title = escapeHtml(item.title);
          const itemUrl = getSafeUrl(item.href, ["http:", "https:"]);
          const titleMarkup = itemUrl
            ? `<a class="portfolio-title-link" href="${escapeHtml(itemUrl)}" rel="noopener noreferrer">${title}</a>`
            : title;
          const descriptionMarkup = window.ESC_MARKDOWN
            ? window.ESC_MARKDOWN.toHtml(item.description ?? "")
            : escapeHtml(item.description ?? "");
          const slides = images.length
            ? images
                .map(
                  (image, imageIndex) => `
                            <img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(imageCaptions[imageIndex] ?? item.title)}"
                                class="portfolio-thumb"
                            />
                        `,
                )
                .join("")
            : `
                        <div class="portfolio-image-empty">
                            <i class="bi bi-image" aria-hidden="true"></i>
                            <span>등록된 이미지가 없습니다.</span>
                        </div>
                    `;
          const controls =
            images.length > 1
              ? `
                            <button class="portfolio-slide-control portfolio-slide-prev" type="button" aria-label="이전 대표 이미지">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <button class="portfolio-slide-control portfolio-slide-next" type="button" aria-label="다음 대표 이미지">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                            <div class="portfolio-slide-dots" aria-hidden="true">
                                ${images.map((_, imageIndex) => `<span class="${imageIndex === 0 ? "active" : ""}"></span>`).join("")}
                            </div>
                        `
              : "";

          return `
                    <div class="col-lg-6">
                        <article
                            class="portfolio-item"
                            data-portfolio-index="${itemIndex}"
                            data-has-images="${images.length > 0}"
                            ${images.length ? 'role="button" tabindex="0"' : ""}
                        >
                            <div class="portfolio-slider" data-slide-index="0">
                                <div class="portfolio-slide-track">
                                    ${slides}
                                </div>
                                ${controls}
                            </div>
                            <div class="portfolio-body">
                                <div class="portfolio-icon">
                                    <i class="bi ${escapeHtml(item.icon)}"></i>
                                </div>
                                <div>
                                    <h4 class="portfolio-title">${titleMarkup}</h4>
                                    <div class="portfolio-date">${escapeHtml(item.date)}</div>
                                    <div class="portfolio-description markdown-content markdown-content-compact">${descriptionMarkup}</div>
                                </div>
                            </div>
                        </article>
                    </div>
                `;
        })
        .join("");

      const updateCardSlide = (slider, index) => {
        const track = slider.querySelector(".portfolio-slide-track");
        const slides = slider.querySelectorAll(".portfolio-thumb");
        const dots = slider.querySelectorAll(".portfolio-slide-dots span");
        const nextIndex = (index + slides.length) % slides.length;

        slider.dataset.slideIndex = String(nextIndex);
        track.style.transform = `translateX(-${nextIndex * 100}%)`;
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle("active", dotIndex === nextIndex);
        });
      };

      select(".portfolio-slider", true).forEach((slider) => {
        const slides = slider.querySelectorAll(".portfolio-thumb");
        if (slides.length <= 1) return;

        slider
          .querySelector(".portfolio-slide-prev")
          .addEventListener("click", (event) => {
            event.stopPropagation();
            updateCardSlide(slider, Number(slider.dataset.slideIndex) - 1);
          });
        slider
          .querySelector(".portfolio-slide-next")
          .addEventListener("click", (event) => {
            event.stopPropagation();
            updateCardSlide(slider, Number(slider.dataset.slideIndex) + 1);
          });

        window.setInterval(() => {
          if (document.hidden || !slider.isConnected) return;
          updateCardSlide(slider, Number(slider.dataset.slideIndex) + 1);
        }, 3500);
      });

      const imageOverlay = select("#imageOverlay");
      if (imageOverlay) {
        const overlayImage = select(".image-overlay-img");
        const overlayTitle = select(".image-overlay-title");
        const overlayDescription = select(".image-overlay-description");
        const overlayCount = select(".image-overlay-count");
        const closeButton = select(".image-overlay-close");
        const prevButton = select(".image-overlay-prev");
        const nextButton = select(".image-overlay-next");
        let currentImages = [];
        let currentCaptions = [];
        let currentTitle = "";
        let currentIndex = 0;

        const updateOverlay = () => {
          overlayImage.src = currentImages[currentIndex];
          overlayImage.alt = currentCaptions[currentIndex] || currentTitle;
          overlayTitle.textContent = currentTitle;
          overlayDescription.textContent = currentCaptions[currentIndex] || "";
          overlayCount.textContent =
            currentImages.length > 1
              ? `${currentIndex + 1} / ${currentImages.length}`
              : "";
          prevButton.hidden = currentImages.length <= 1;
          nextButton.hidden = currentImages.length <= 1;
        };

        const openOverlay = (item, startIndex = 0) => {
          currentImages = getPortfolioImages(item);
          currentCaptions = getPortfolioImageCaptions(item);
          currentTitle = item.title;
          currentIndex = startIndex;
          updateOverlay();
          imageOverlay.classList.add("active");
          imageOverlay.setAttribute("aria-hidden", "false");
          imageOverlay.inert = false;
          document.body.classList.add("image-overlay-open");
          closeButton.focus();
        };

        const closeOverlay = () => {
          imageOverlay.classList.remove("active");
          imageOverlay.setAttribute("aria-hidden", "true");
          imageOverlay.inert = true;
          document.body.classList.remove("image-overlay-open");
          overlayImage.src = "";
          overlayImage.alt = "";
        };

        const showOverlayImage = (step) => {
          currentIndex =
            (currentIndex + step + currentImages.length) % currentImages.length;
          updateOverlay();
        };

        select('.portfolio-item[data-has-images="true"]', true).forEach(
          (itemElement) => {
            itemElement.addEventListener("click", (event) => {
              if (event.target.closest("a, button")) return;

              const item =
                portfolioData[Number(itemElement.dataset.portfolioIndex)];
              const slider = itemElement.querySelector(".portfolio-slider");
              openOverlay(item, Number(slider.dataset.slideIndex));
            });
            itemElement.addEventListener("keydown", (event) => {
              if (event.target.closest("a, button")) return;

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const item =
                  portfolioData[Number(itemElement.dataset.portfolioIndex)];
                const slider = itemElement.querySelector(".portfolio-slider");
                openOverlay(item, Number(slider.dataset.slideIndex));
              }
            });
          },
        );

        select(".portfolio-title-link", true).forEach((link) => {
          link.addEventListener("click", (event) => {
            event.stopPropagation();
          });
        });

        closeButton.addEventListener("click", closeOverlay);
        prevButton.addEventListener("click", () => showOverlayImage(-1));
        nextButton.addEventListener("click", () => showOverlayImage(1));
        imageOverlay.addEventListener("click", (event) => {
          if (event.target === imageOverlay) {
            closeOverlay();
          }
        });
        document.addEventListener("keydown", (event) => {
          if (!imageOverlay.classList.contains("active")) return;

          if (event.key === "Escape") {
            closeOverlay();
          }
          if (event.key === "ArrowLeft" && currentImages.length > 1) {
            showOverlayImage(-1);
          }
          if (event.key === "ArrowRight" && currentImages.length > 1) {
            showOverlayImage(1);
          }
        });
      }
    };

    initializePortfolio();
  }

  /**
   * Contact links
   */
  const contactList = select("#contactList");
  const contactSocials = select("#contactSocials");
  const contactData = window.ESC_CONTENT?.contacts ?? [];
  if (contactList) {
    contactList.replaceChildren();
    contactData.forEach((item) => {
      const rawHref =
        item.type === "email" && item.email
          ? `mailto:${item.email}`
          : item.type === "github" && item.url
            ? item.url
            : item.href;
      const href = getSafeUrl(rawHref, ["http:", "https:", "mailto:"]);
      if (!href) return;

      const row = document.createElement("li");
      const icon = document.createElement("span");
      icon.className = `bi ${/^bi-[a-z0-9-]+$/.test(item.icon) ? item.icon : "bi-link-45deg"}`;
      const label = document.createTextNode(`${item.label}: `);
      const link = document.createElement("a");
      link.href = href;
      link.textContent = item.text;
      if (/^https?:/i.test(href)) link.rel = "noopener noreferrer";
      row.append(icon, label, link);
      contactList.append(row);
    });
  }
  if (contactSocials) {
    contactSocials.replaceChildren();
    contactData
      .filter((item) => item.social)
      .forEach((item) => {
        const rawHref =
          item.type === "email" && item.email
            ? `mailto:${item.email}`
            : item.type === "github" && item.url
              ? item.url
              : item.href;
        const href = getSafeUrl(rawHref, ["http:", "https:", "mailto:"]);
        if (!href) return;

        const row = document.createElement("li");
        const link = document.createElement("a");
        link.href = href;
        if (/^https?:/i.test(href)) {
          link.rel = "noopener noreferrer";
        }
        link.setAttribute("aria-label", item.label);
        const circle = document.createElement("span");
        circle.className = "ico-circle";
        const icon = document.createElement("i");
        const iconName = item.social_icon ?? item.icon;
        icon.className = `bi ${
          /^bi-[a-z0-9-]+$/.test(iconName) ? iconName : "bi-link-45deg"
        }`;
        circle.append(icon);
        link.append(circle);
        row.append(link);
        contactSocials.append(row);
      });
  }
})();
