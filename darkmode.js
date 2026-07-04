(function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark-pending');
  }
})();

function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
});
