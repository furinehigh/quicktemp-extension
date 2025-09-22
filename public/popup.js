import DOMPurify from './purify.es.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const subject = params.get('subject');
    const from = params.get('from');
    const to = params.get('to');
    const htmlContent = params.get('html');
    const textContent = params.get('text');

    document.title = subject || 'Email';
    document.getElementById('subject').textContent = subject || '(No Subject)';
    document.getElementById('from').textContent = from;
    document.getElementById('to').textContent = to;

    const contentDiv = document.getElementById('content');
    if (htmlContent) {
        const sanitized = DOMPurify.sanitize(decodeURIComponent(htmlContent), {
            USE_PROFILES: { html: true }
        });
        contentDiv.innerHTML = sanitized;

        contentDiv.querySelectorAll('a').forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });
    } else {
        const pre = document.createElement('pre');
        pre.style.fontFamily = 'monospace';
        pre.style.fontSize = '14px';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.padding = '1rem';
        pre.textContent = textContent || 'No content available.';
        contentDiv.appendChild(pre);
    }
});