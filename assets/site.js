(() => {
  const sticky = document.querySelector("[data-sticky-cta]");
  if (sticky) {
    document.body.classList.add("has-sticky");

    const syncSticky = () => {
      if (window.innerWidth <= 767) {
        sticky.classList.add("is-visible");
        return;
      }
      if (window.scrollY > 140) {
        sticky.classList.add("is-visible");
      } else {
        sticky.classList.remove("is-visible");
      }
    };

    syncSticky();
    window.addEventListener("scroll", syncSticky, { passive: true });
    window.addEventListener("resize", syncSticky);
  }

  const copyButtons = document.querySelectorAll("[data-copy-link]");
  const statusNode = document.querySelector("[data-share-status]");

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const setCopiedState = (button) => {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = "Skopiowano";
    if (statusNode) {
      statusNode.textContent = "Link do badania został skopiowany.";
    }
    window.setTimeout(() => {
      button.textContent = original;
    }, 2200);
  };

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy-link");
      if (!text) {
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          fallbackCopy(text);
        }
        setCopiedState(button);
      } catch (error) {
        try {
          fallbackCopy(text);
          setCopiedState(button);
        } catch (fallbackError) {
          if (statusNode) {
            statusNode.textContent = "Nie udało się skopiować linku. Skopiuj adres ręcznie.";
          }
        }
      }
    });
  });
})();
