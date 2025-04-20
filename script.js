const siteOwner = "JamesTNBS"; // Replace with your actual owner username

// Global user
let currentUser = null;

// Define navLinks globally to avoid scope issues
const navLinks = document.querySelectorAll('.side-panel .nav-links a');

// Article ID to URL mapping based on index.html (fixed to use relative paths)
const articleIdToUrl = {
  'story-1': 'review1.html',
  'story-2': 'review4.html',
  'story-3': 'review7.html',
  'story-4': 'review10.html',
  'article-1': 'review2.html',
  'article-2': 'review5.html',
  'article-3': 'review8.html',
  'article-4': 'review11.html',
  'article-5': 'review13.html',
  'more-story-1': 'review3.html',
  'more-story-2': 'review6.html',
  'more-story-3': 'review9.html',
  'more-story-4': 'review12.html'
};

// Utility function to escape HTML special characters
function escapeHTML(str) {
  if (!str) return '';
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

// Utility function to escape single quotes for JavaScript string literals
function escapeJSString(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'");
}

// Debounce function to limit the rate of search execution
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidePanel = document.getElementById('sidePanel');
  const icon = menuToggle?.querySelector('i');
  const lightToggle = document.querySelector('.toggle-light-mode');
  const container = document.querySelector('.container');
  const themeIcon = lightToggle?.querySelector('i');
  const commentInput = document.getElementById("comment-input");
  const comments = JSON.parse(localStorage.getItem("comments")) || [];
  const commentList = document.getElementById("comments-list");

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add('light');
    if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
  } else {
    document.body.classList.add('dark');
    if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  // Load saved user
  currentUser = localStorage.getItem("username");
  if (currentUser) {
    if (commentInput) {
      commentInput.placeholder = `Write a comment as ${escapeHTML(currentUser)}...`;
    }
  }

  // Check state on page load
  if (currentUser) {
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    const userDisplay = document.getElementById("user-display");
    const usernameText = document.getElementById("username-text");
    if (logoutBtn) logoutBtn.style.display = "block";
    if (loginBtn) loginBtn.style.display = "none";
    if (usernameText) usernameText.textContent = currentUser;
    if (userDisplay) userDisplay.style.display = "block";
  } else {
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    const userDisplay = document.getElementById("user-display");
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "block";
    if (userDisplay) userDisplay.style.display = "none";
  }

  // Clear existing comments to prevent duplicates
  if (commentList) {
    commentList.innerHTML = '';
    renderComments(); // Call renderComments after currentUser is loaded
  }

  // Side panel toggle
  if (menuToggle && sidePanel && icon) {
    menuToggle.addEventListener('click', () => {
      sidePanel.classList.toggle('open');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
      if (container) container.classList.toggle('shifted');
      const commentSection = document.getElementById("comment-section");
      if (commentSection) {
        commentSection.classList.toggle("shifted");
      }
    });
  }

  // Theme toggle
  if (lightToggle && themeIcon) {
    lightToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      document.body.classList.toggle('light');
      const isDark = document.body.classList.contains('dark');
      themeIcon.classList.toggle('fa-sun');
      themeIcon.classList.toggle('fa-moon');
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }

  // Close modals with ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePopup();
      closeLoginPopup();
      closeSearchPopup();
    }
  });

  // Handle Enter key for login
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    usernameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        login();
      }
    });
  }

  // Highlight active sidebar link based on URL or hash
  const setActiveLink = () => {
    const currentPath = window.location.pathname; // e.g., "/index.html"
    const currentHash = window.location.hash || ''; // e.g., "#design"

    // Remove 'active' class from all links
    navLinks.forEach(link => link.classList.remove('active'));

    // Check if we're on a review page (review1.html to review6.html)
    const isReviewPage = /review[1-6]\.html/.test(currentPath);
    if (isReviewPage) {
      // In-page section highlighting
      let activeLink = null;
      if (currentHash) {
        activeLink = Array.from(navLinks).find(link => link.getAttribute('href') === currentHash);
      }
      if (activeLink && activeLink.getAttribute('href') !== '#search') {
        activeLink.classList.add('active');
      } else {
        // Default to the first in-page link if no hash matches
        const firstSectionLink = Array.from(navLinks).find(link => {
          const href = link.getAttribute('href');
          return href.startsWith('#') && href !== '#search' && document.getElementById(href.substring(1));
        });
        if (firstSectionLink) {
          firstSectionLink.classList.add('active');
          history.replaceState(null, null, firstSectionLink.getAttribute('href'));
        }
      }
    } else {
      // External page highlighting (e.g., Home)
      const activeLink = Array.from(navLinks).find(link => {
        const linkPath = link.getAttribute('href');
        return linkPath === currentPath || linkPath === currentPath.split('/').pop();
      });
      if (activeLink) {
        activeLink.classList.add('active');
      } else {
        // Default to Home if no match
        const homeLink = Array.from(navLinks).find(link => link.getAttribute('href') === 'index.html');
        if (homeLink) {
          homeLink.classList.add('active');
        }
      }
    }
  };

  // Handle clicks on sidebar links
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // If it's the search link, open the search popup
      if (href === '#search') {
        e.preventDefault();
        openSearchPopup();
        return;
      }

      // If it's an in-page link (starts with #), handle scrolling
      if (href.startsWith('#')) {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, null, href);
        }
      }
    });
  });

  // Update active link on scroll (only for review pages)
  const sections = Array.from(navLinks)
    .filter(link => {
      const href = link.getAttribute('href');
      return href.startsWith('#') && href !== '#search' && document.getElementById(href.substring(1));
    })
    .map(link => document.getElementById(link.getAttribute('href').substring(1)));

  const updateActiveLinkOnScroll = () => {
    // Only run scroll-based highlighting on review pages (review1.html to review6.html)
    if (!/review[1-6]\.html/.test(window.location.pathname)) return;

    let currentSection = null;

    sections.forEach(section => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom >= 150) {
        currentSection = section;
      }
    });

    if (currentSection) {
      const sectionId = currentSection.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
          history.replaceState(null, null, `#${sectionId}`);
        }
      });
    } else if (window.scrollY <= 50) {
      navLinks.forEach(link => link.classList.remove('active'));
      const firstSectionLink = Array.from(navLinks).find(link => {
        const href = link.getAttribute('href');
        return href.startsWith('#') && href !== '#search' && document.getElementById(href.substring(1));
      });
      if (firstSectionLink) {
        firstSectionLink.classList.add('active');
        history.replaceState(null, null, firstSectionLink.getAttribute('href'));
      }
    }
  };

  // Set active link on page load
  setActiveLink();

  // Update active link on hash change
  window.addEventListener('hashchange', setActiveLink);

  // Update active link on scroll
  window.addEventListener('scroll', updateActiveLinkOnScroll);

  // Handle Enter key for comments
  if (commentInput) {
    commentInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        postComment();
      }
    });
  }
});

// Search popup
function openSearchPopup() {
  const searchModal = document.getElementById("search-modal");
  if (!searchModal) {
    console.error("Search modal element not found!");
    return;
  }
  searchModal.style.display = "flex";
  const searchInput = document.getElementById("search-input");
  if (!searchInput) {
    console.error("Search input element not found!");
    return;
  }
  searchInput.focus();

  const debouncedSearch = debounce(() => {
    performSearch();
  }, 300);

  searchInput.addEventListener('input', debouncedSearch);

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
}

function closeSearchPopup() {
  const searchModal = document.getElementById("search-modal");
  if (searchModal) {
    searchModal.style.display = "none";
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
  }
}

function performSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  if (!searchInput || !searchResults) {
    console.error("Search input or results element not found!");
    return;
  }

  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = "<p2>Please enter a search query.</p2>";
    return;
  }

  searchResults.innerHTML = "";

  fetch('index.html') // Fixed to use relative path
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch index.html: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      searchInFetchedPage(query, doc, searchResults);
    })
    .catch(error => {
      console.error('Error fetching index.html:', error);
      searchResults.innerHTML = `<p>Error: Unable to search index.html. ${error.message}</p>`;
    });
}

function searchInFetchedPage(query, doc, searchResults) {
  const sections = doc.querySelectorAll('.top-stories, .main-content, .more-stories');
  if (!sections.length) {
    searchResults.innerHTML = "<p>Error: Content sections not found in index.html.</p>";
    return;
  }

  const results = [];
  const queryLower = query.toLowerCase();
  let resultIndex = 0;

  sections.forEach(section => {
    const articles = section.querySelectorAll('.story-card, .article-item, .story-item');
    articles.forEach(article => {
      const title = article.querySelector('h3')?.textContent.trim() || '';
      const description = article.querySelector('p')?.textContent.trim() || '';
      const imageSrc = article.querySelector('img')?.getAttribute('src') || '';
      const articleId = article.getAttribute('id');

      if (!articleId) {
        console.warn('Article found without an ID attribute.');
        return;
      }

      const titleMatch = title.toLowerCase().includes(queryLower);
      const descMatch = description.toLowerCase().includes(queryLower);

      if (titleMatch || descMatch) {
        let snippet = titleMatch ? title : description;
        const matchIndex = snippet.toLowerCase().indexOf(queryLower);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(snippet.length, matchIndex + query.length + 50);
        snippet = (start > 0 ? "..." : "") + snippet.substring(start, end) + (end < snippet.length ? "..." : "");

        const highlightedSnippet = snippet.replace(
          new RegExp(`(${query})`, 'gi'),
          '<span class="highlight">$1</span>'
        );

        const shortDesc = description.length > 50 ? description.substring(0, 47) + "..." : description;

        results.push({
          title: title,
          description: shortDesc,
          imageSrc: imageSrc,
          snippet: highlightedSnippet,
          articleId: articleId,
          index: resultIndex++
        });
      }
    });
  });

  displaySearchResults(results, searchResults);
}

function displaySearchResults(results, searchResults) {
  if (results.length === 0) {
    searchResults.innerHTML = "<p>No results found.</p>";
    return;
  }

  results.forEach(result => {
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';

    // Use the articleIdToUrl mapping to get the correct URL
    const articleUrl = articleIdToUrl[result.articleId] || 'index.html'; // Fallback to index.html if no mapping
    let cardContent = `<a href="${escapeHTML(articleUrl)}" class="mini-card-link" onclick="closeSearchPopup()">`;
    if (result.imageSrc) {
      cardContent += `<img src="${escapeHTML(result.imageSrc)}" alt="${escapeHTML(result.title)}" class="mini-card-img">`;
    }
    cardContent += `
      <div class="mini-card-content">
        <h4>${escapeHTML(result.title)}</h4>
        <p>${escapeHTML(result.description)}</p>
        <p class="snippet">Match: ${result.snippet}</p>
      </div>
    </a>`;

    miniCard.innerHTML = cardContent;
    searchResults.appendChild(miniCard);
  });
}

// Image popup
function openPopup(src) {
  const popup = document.getElementById("image-popup");
  if (popup) {
    document.getElementById("popup-img").src = src;
    popup.style.display = "flex";
  }
}

function closePopup() {
  const popup = document.getElementById("image-popup");
  if (popup) {
    popup.style.display = "none";
  }
}

// Login and comment system
function checkLogin() {
  if (!currentUser) {
    const loginModal = document.getElementById("login-modal");
    const usernameInput = document.getElementById("username");
    if (loginModal) {
      loginModal.style.display = "flex";
      if (usernameInput) usernameInput.focus();
    } else {
      console.error("Login modal element not found!");
    }
  }
}

function deleteComment(button) {
  const commentDiv = button.closest(".comment");
  const fullText = commentDiv.textContent.replace("Delete", "").trim();
  const userToDelete = commentDiv.querySelector("strong").textContent.replace(":", "").trim();
  const textToDelete = fullText.replace(`${userToDelete}:`, "").trim();

  let comments = JSON.parse(localStorage.getItem("comments")) || [];
  comments = comments.filter(comment => !(comment.user === escapeHTML(userToDelete) && comment.text === escapeHTML(textToDelete)));
  localStorage.setItem("comments", JSON.stringify(comments));
  commentDiv.remove();
}

function login() {
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    const username = usernameInput.value.trim();
    if (username !== "") {
      currentUser = escapeHTML(username);
      localStorage.setItem("username", currentUser);
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.style.display = "none";
      usernameInput.value = "";
      const commentInput = document.getElementById("comment-input");
      if (commentInput) {
        commentInput.placeholder = `Write a comment as ${escapeHTML(currentUser)}...`;
      }

      const logoutBtn = document.getElementById("logout-btn");
      const loginBtn = document.getElementById("login-btn");
      const usernameText = document.getElementById("username-text");
      const userDisplay = document.getElementById("user-display");
      if (logoutBtn) logoutBtn.style.display = "block";
      if (loginBtn) loginBtn.style.display = "none";
      if (usernameText) usernameText.textContent = currentUser;
      if (userDisplay) userDisplay.style.display = "block";

      renderComments();
    }
  } else {
    console.error("Username input element not found!");
  }
}

function closeLoginPopup() {
  const loginModal = document.getElementById("login-modal");
  if (loginModal) {
    loginModal.style.display = "none";
  }
}

function postComment() {
  const commentInput = document.getElementById("comment-input");
  if (commentInput) {
    const commentText = commentInput.value.trim();
    if (commentText !== "" && currentUser) {
      const commentList = document.getElementById("comments-list");
      if (commentList) {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.innerHTML = `<strong>${escapeHTML(currentUser)}:</strong> ${escapeHTML(commentText)}`;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.onclick = function () {
          showConfirmDialog(() => deleteComment(this));
        };

        commentDiv.appendChild(deleteButton);

        let comments = JSON.parse(localStorage.getItem("comments")) || [];
        comments.push({ user: escapeHTML(currentUser), text: escapeHTML(commentText) });
        localStorage.setItem("comments", JSON.stringify(comments));

        commentList.appendChild(commentDiv);
        commentInput.value = "";
      }
    } else if (!currentUser) {
      checkLogin();
    }
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("username");
  const commentInput = document.getElementById("comment-input");
  if (commentInput) {
    commentInput.placeholder = "Write a comment...";
  }

  const logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("login-btn");
  const usernameText = document.getElementById("username-text");
  const userDisplay = document.getElementById("user-display");
  if (logoutBtn) logoutBtn.style.display = "none";
  if (loginBtn) loginBtn.style.display = "block";
  if (usernameText) usernameText.textContent = "";
  if (userDisplay) userDisplay.style.display = "none";

  renderComments();
}

function renderComments() {
  const commentList = document.getElementById("comments-list");
  if (!commentList) return;
  commentList.innerHTML = '';
  const comments = JSON.parse(localStorage.getItem("comments")) || [];

  comments.forEach(comment => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    commentDiv.innerHTML = `<strong>${comment.user}:</strong> ${comment.text}`;

    if (currentUser === siteOwner || comment.user === currentUser) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Delete";
      deleteButton.onclick = function () {
        showConfirmDialog(() => deleteComment(this));
      };
      commentDiv.appendChild(deleteButton);
    }

    commentList.appendChild(commentDiv);
  });
}

function showConfirmDialog(callback) {
  const dialog = document.getElementById("custom-confirm");
  if (!dialog) return;
  dialog.style.display = "flex";

  const yesBtn = document.getElementById("confirm-yes");
  const noBtn = document.getElementById("confirm-no");

  const close = () => {
    dialog.style.display = "none";
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };

  yesBtn.onclick = () => {
    close();
    callback();
  };

  noBtn.onclick = () => {
    close();
  };
}
