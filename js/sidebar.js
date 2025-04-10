fetch('sidebar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sidebar').innerHTML = html;

    // Get the current page filename, e.g., 'Dashboard.html'
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();

    // Wait for the sidebar to load into the DOM, then find links
    const links = document.querySelectorAll('#sidebar a');

    links.forEach(link => {
      const linkHref = link.getAttribute('href')?.toLowerCase();
      if (linkHref && linkHref === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active'); // Optional: ensure others aren't active
      }
    });
  })
  .catch(err => console.error('Failed to load sidebar:', err));
