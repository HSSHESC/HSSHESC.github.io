/**
 * Template Name: DevFolio - v4.10.0
 * Author: BootstrapMade.com
 * License: https://bootstrapmade.com/license/
 */
(function () {
    "use strict";

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

    const escapeHtml = (value) =>
        String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

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
    window.addEventListener("load", navbarlinksActive);
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
        window.addEventListener("load", headerScrolled);
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
        window.addEventListener("load", toggleBacktotop);
        onscroll(document, toggleBacktotop);
    }

    /**
     * Mobile nav toggle
     */
    on("click", ".mobile-nav-toggle", function (e) {
        select("#navbar").classList.toggle("navbar-mobile");
        this.classList.toggle("bi-list");
        this.classList.toggle("bi-x");
    });

    /**
     * Mobile nav dropdowns activate
     */
    on(
        "click",
        ".navbar .dropdown > a",
        function (e) {
            if (select("#navbar").classList.contains("navbar-mobile")) {
                e.preventDefault();
                this.nextElementSibling.classList.toggle("dropdown-active");
            }
        },
        true,
    );

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
    window.addEventListener("load", () => {
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
    if (typed) {
        let typed_strings = typed.getAttribute("data-typed-items");
        typed_strings = typed_strings.split(",");
        new Typed(".typed", {
            strings: typed_strings,
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
        const portfolioData = window.ESC_CONTENT?.portfolio ?? [];

        portfolioItems.innerHTML = portfolioData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(
                (item) => `
                    <div class="col-lg-6">
                        <div class="portfolio-item">
                            <img
                                src="${escapeHtml(item.image)}"
                                alt="${escapeHtml(item.title)}"
                                class="portfolio-thumb portfolio-zoom-image"
                                role="button"
                                tabindex="0"
                            />
                            <div class="portfolio-body">
                                <div class="portfolio-icon">
                                    <i class="bi ${escapeHtml(item.icon)}"></i>
                                </div>
                                <div>
                                    <h4 class="portfolio-title">${escapeHtml(item.title)}</h4>
                                    <div class="portfolio-date">${escapeHtml(item.date)}</div>
                                    <p class="portfolio-description">${escapeHtml(item.description)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
            )
            .join("");
    }

    /**
     * Contact links
     */
    const contactList = select("#contactList");
    const contactSocials = select("#contactSocials");
    const contactData = window.ESC_CONTENT?.contacts ?? [];
    if (contactList) {
        contactList.innerHTML = contactData
            .map(
                (item) => `
                    <li>
                        <span class="bi ${escapeHtml(item.icon)}"></span>
                        ${escapeHtml(item.label)}:
                        <a href="${escapeHtml(item.href)}">${escapeHtml(item.text)}</a>
                    </li>
                `,
            )
            .join("");
    }
    if (contactSocials) {
        contactSocials.innerHTML = contactData
            .filter((item) => item.social)
            .map(
                (item) => `
                    <li>
                        <a href="${escapeHtml(item.href)}" aria-label="${escapeHtml(item.label)}">
                            <span class="ico-circle">
                                <i class="bi ${escapeHtml(item.socialIcon ?? item.icon)}"></i>
                            </span>
                        </a>
                    </li>
                `,
            )
            .join("");
    }

    /**
     * Portfolio image overlay
     */
    const imageOverlay = select("#imageOverlay");
    if (imageOverlay) {
        const overlayImage = select(".image-overlay-img");
        const closeButton = select(".image-overlay-close");
        const zoomImages = select(".portfolio-zoom-image", true);

        const openOverlay = (image) => {
            overlayImage.src = image.src;
            overlayImage.alt = image.alt;
            imageOverlay.classList.add("active");
            imageOverlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("image-overlay-open");
            closeButton.focus();
        };

        const closeOverlay = () => {
            imageOverlay.classList.remove("active");
            imageOverlay.setAttribute("aria-hidden", "true");
            document.body.classList.remove("image-overlay-open");
            overlayImage.src = "";
            overlayImage.alt = "";
        };

        zoomImages.forEach((image) => {
            image.addEventListener("click", () => openOverlay(image));
            image.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openOverlay(image);
                }
            });
        });

        closeButton.addEventListener("click", closeOverlay);
        imageOverlay.addEventListener("click", (event) => {
            if (event.target === imageOverlay) {
                closeOverlay();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (
                event.key === "Escape" &&
                imageOverlay.classList.contains("active")
            ) {
                closeOverlay();
            }
        });
    }

    /**
     * Copyright year
     */
    const copyrightYear = select(".copyright-year");
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    /**
     * Preloader
     */
    let preloader = select("#preloader");
    if (preloader) {
        window.addEventListener("load", () => {
            preloader.remove();
        });
    }
})();
