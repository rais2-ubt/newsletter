/**
 * Sidebar Module
 * Shared sidebar navigation component for all pages
 */
const Sidebar = {
    nav: [
        {
            title: 'Main',
            items: [
                { href: 'index.html', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>' },
                { href: 'builder.html', label: 'Create Newsletter', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/></svg>' },
                { href: 'csv-processor.html', label: 'CSV Processor', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z"/></svg>' },
                { href: 'cms-export.html', label: 'CMS Export', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z"/></svg>' },
                { href: 'viewer.html', label: 'Archive', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg>', badge: 'newsletters' },
            ]
        },
        {
            title: 'Manage',
            items: [
                { href: 'subscribers.html', label: 'Subscribers', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>', badge: 'subscribers' },
                { href: 'settings.html', label: 'Settings', icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>' },
            ]
        }
    ],

    init() {
        const aside = document.querySelector('.sidebar');
        if (!aside) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        let html = '<div class="sidebar-header">' +
            '<a href="index.html" class="logo">RAIS<sup>\u00B2</sup></a>' +
            '<p class="logo-subtitle">Newsletter Manager</p>' +
            '</div><nav class="sidebar-nav">';

        for (const section of this.nav) {
            html += '<div class="nav-section">' +
                '<div class="nav-section-title">' + section.title + '</div>';

            for (const item of section.items) {
                const isActive = currentPage === item.href ||
                    (currentPage === '' && item.href === 'index.html') ||
                    (currentPage === '/' && item.href === 'index.html');
                const activeClass = isActive ? ' active' : '';
                const badge = item.badge
                    ? '<span class="nav-badge" data-badge="' + item.badge + '" style="display:none;">0</span>'
                    : '';

                html += '<a href="' + item.href + '" class="nav-link' + activeClass + '">' +
                    item.icon + ' ' + item.label + badge + '</a>';
            }

            html += '</div>';
        }

        html += '</nav>';
        aside.innerHTML = html;

        this.initMobileMenu();
    },

    initMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');

        if (btn && sidebar) {
            btn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Sidebar.init();
});

window.Sidebar = Sidebar;
